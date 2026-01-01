import { Hono } from "hono";
import { z } from "zod";
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { requireAuth, adminOnly } from "../../shared/middleware";
import type { MovieRating } from "../../shared/types/entities";

const ratings = new Hono();

// Spam detection utility
function detectSpam(review?: string): boolean {
  if (!review) return false;

  const text = review.toLowerCase();
  const spamKeywords = [
    "buy now",
    "click here",
    "visit",
    "free money",
    "discount",
    "cheap",
    "scam",
    "piratemovies",
    "watch free",
    "no virus",
    "best deals",
  ];

  // Check for spam keywords
  const hasSpamKeywords = spamKeywords.some((keyword) => text.includes(keyword));

  // Check for excessive caps (>50% uppercase)
  const uppercaseCount = (review.match(/[A-Z]/g) || []).length;
  const letterCount = (review.match(/[a-zA-Z]/g) || []).length;
  const hasExcessiveCaps = letterCount > 0 && uppercaseCount / letterCount > 0.5;

  // Check for excessive exclamation marks (3+ in a row or 5+ total)
  const hasExcessiveExclamation = /!!!+/.test(review) || (review.match(/!/g) || []).length >= 5;

  // Check for URLs
  const hasUrl = /(https?:\/\/|www\.|\.com|\.net|\.org)/i.test(review);

  return hasSpamKeywords || hasExcessiveCaps || hasExcessiveExclamation || hasUrl;
}

// Validation schema
const createRatingSchema = z.object({
  user_id: z.string(),
  movie_id: z.string(),
  rating: z.number().min(1).max(10),
  review: z.string().optional(),
});

// GET /ratings/all - Get all ratings (admin-only)
ratings.get("/all", adminOnly(), async (c) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
      }),
    );

    // Add spam detection to each rating
    const ratingsWithSpamDetection = (result.Items as MovieRating[]).map((rating) => ({
      ...rating,
      is_spam: detectSpam(rating.review),
    }));

    return c.json({
      success: true,
      data: ratingsWithSpamDetection,
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[ratings]", "Error fetching all ratings:", error);
    return c.json({ success: false, error: "Failed to fetch ratings" }, 500);
  }
});

const updateRatingSchema = z.object({
  rating: z.number().min(1).max(10).optional(),
  review: z.string().optional(),
});

// GET /ratings/movie/:movieId - Get ratings for a movie
ratings.get("/movie/:movieId", async (c) => {
  const { movieId } = c.req.param();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        IndexName: "movie_id-index",
        KeyConditionExpression: "movie_id = :movieId",
        ExpressionAttributeValues: {
          ":movieId": movieId,
        },
      }),
    );

    // Calculate average rating and add spam detection
    const items = (result.Items as MovieRating[]).map((rating) => ({
      ...rating,
      is_spam: detectSpam(rating.review),
    }));
    const avgRating =
      items.length > 0 ? items.reduce((sum, r) => sum + r.rating, 0) / items.length : 0;

    return c.json({
      success: true,
      data: items,
      count: result.Count || 0,
      average_rating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error("[ratings]", "Error fetching ratings:", error);
    return c.json({ success: false, error: "Failed to fetch ratings" }, 500);
  }
});

// GET /ratings/user/:userId - Get user's ratings
ratings.get("/user/:userId", async (c) => {
  const { userId } = c.req.param();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        IndexName: "user_id-index",
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      }),
    );

    const items = (result.Items as MovieRating[]).map((rating) => ({
      ...rating,
      is_spam: detectSpam(rating.review),
    }));

    return c.json({
      success: true,
      data: items,
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[ratings]", "Error fetching user ratings:", error);
    return c.json({ success: false, error: "Failed to fetch ratings" }, 500);
  }
});

// POST /ratings - Create a new rating
ratings.post("/", requireAuth(), async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createRatingSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const ratingId = `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rating: MovieRating = {
      id: ratingId,
      user_id: data.user_id,
      movie_id: data.movie_id,
      rating: data.rating,
      review: data.review,
      created_at: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Item: rating,
      }),
    );

    // Update movie's average rating (simplified - in production, use a more robust approach)
    // This recalculates the average
    const movieRatings = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        IndexName: "movie_id-index",
        KeyConditionExpression: "movie_id = :movieId",
        ExpressionAttributeValues: {
          ":movieId": data.movie_id,
        },
      }),
    );

    const allRatings = movieRatings.Items as MovieRating[];
    const newAvg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: data.movie_id },
        UpdateExpression: "SET rating = :rating, updated_at = :updated",
        ExpressionAttributeValues: {
          ":rating": Math.round(newAvg * 10) / 10,
          ":updated": new Date().toISOString(),
        },
      }),
    );

    return c.json(
      {
        success: true,
        data: rating,
        message: "Rating submitted successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[ratings]", "Error creating rating:", error);
    return c.json({ success: false, error: "Failed to submit rating" }, 500);
  }
});

// PUT /ratings/:id - Update a rating
ratings.put("/:id", requireAuth(), async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json();
    const validationResult = updateRatingSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;

    // Check if rating exists
    const existingRating = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Key: { id },
      }),
    );

    if (!existingRating.Item) {
      return c.json({ success: false, error: "Rating not found" }, 404);
    }

    const oldRating = existingRating.Item as MovieRating;

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      return c.json({ success: false, error: "No fields to update" }, 400);
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    // Recalculate movie average rating if rating value changed
    if (data.rating !== undefined) {
      const movieRatings = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.MOVIE_RATINGS,
          IndexName: "movie_id-index",
          KeyConditionExpression: "movie_id = :movieId",
          ExpressionAttributeValues: {
            ":movieId": oldRating.movie_id,
          },
        }),
      );

      const allRatings = movieRatings.Items as MovieRating[];
      const newAvg =
        allRatings.reduce((sum, r) => {
          if (r.id === id) {
            return sum + data.rating!;
          }
          return sum + r.rating;
        }, 0) / allRatings.length;

      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: oldRating.movie_id },
          UpdateExpression: "SET rating = :rating, updated_at = :updated",
          ExpressionAttributeValues: {
            ":rating": Math.round(newAvg * 10) / 10,
            ":updated": new Date().toISOString(),
          },
        }),
      );
    }

    // Fetch updated rating
    const updatedRating = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Key: { id },
      }),
    );

    return c.json({
      success: true,
      data: updatedRating.Item as MovieRating,
      message: "Rating updated successfully",
    });
  } catch (error) {
    console.error("[ratings]", "Error updating rating:", error);
    return c.json({ success: false, error: "Failed to update rating" }, 500);
  }
});

// DELETE /ratings/:id - Delete a rating (admin-only)
ratings.delete("/:id", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    // Get the rating first
    const existingRating = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Key: { id },
      }),
    );

    if (!existingRating.Item) {
      return c.json({ success: false, error: "Rating not found" }, 404);
    }

    const rating = existingRating.Item as MovieRating;

    // Delete the rating
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        Key: { id },
      }),
    );

    // Recalculate movie average rating
    const movieRatings = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        IndexName: "movie_id-index",
        KeyConditionExpression: "movie_id = :movieId",
        ExpressionAttributeValues: {
          ":movieId": rating.movie_id,
        },
      }),
    );

    const allRatings = movieRatings.Items as MovieRating[];
    const newAvg =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: rating.movie_id },
        UpdateExpression: "SET rating = :rating, updated_at = :updated",
        ExpressionAttributeValues: {
          ":rating": Math.round(newAvg * 10) / 10,
          ":updated": new Date().toISOString(),
        },
      }),
    );

    return c.json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("[ratings]", "Error deleting rating:", error);
    return c.json({ success: false, error: "Failed to delete rating" }, 500);
  }
});

// GET /ratings/movie/:movieId/stats - Get rating statistics for a movie
ratings.get("/movie/:movieId/stats", async (c) => {
  const { movieId } = c.req.param();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIE_RATINGS,
        IndexName: "movie_id-index",
        KeyConditionExpression: "movie_id = :movieId",
        ExpressionAttributeValues: {
          ":movieId": movieId,
        },
      }),
    );

    const ratings = result.Items as MovieRating[];

    if (ratings.length === 0) {
      return c.json({
        success: true,
        data: {
          total_ratings: 0,
          average_rating: 0,
          distribution: {},
        },
      });
    }

    // Calculate statistics
    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / total) * 10) / 10;

    // Rating distribution (1-10)
    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }
    ratings.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return c.json({
      success: true,
      data: {
        total_ratings: total,
        average_rating: average,
        distribution,
      },
    });
  } catch (error) {
    console.error("[ratings]", "Error fetching rating statistics:", error);
    return c.json({ success: false, error: "Failed to fetch rating statistics" }, 500);
  }
});

export default ratings;
