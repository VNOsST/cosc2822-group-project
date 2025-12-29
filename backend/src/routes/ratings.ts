import { Hono } from "hono";
import { z } from "zod";
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../db/client";
import type { MovieRating, Movie } from "../types/entities";

const ratings = new Hono();

// Validation schema
const createRatingSchema = z.object({
  user_id: z.string(),
  movie_id: z.string(),
  rating: z.number().min(1).max(10),
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
      })
    );

    // Calculate average rating
    const items = result.Items as MovieRating[];
    const avgRating =
      items.length > 0
        ? items.reduce((sum, r) => sum + r.rating, 0) / items.length
        : 0;

    return c.json({
      success: true,
      data: items,
      count: result.Count || 0,
      average_rating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
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
      })
    );

    return c.json({
      success: true,
      data: result.Items as MovieRating[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    return c.json({ success: false, error: "Failed to fetch ratings" }, 500);
  }
});

// POST /ratings - Create a new rating
ratings.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createRatingSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        { success: false, error: validationResult.error.errors },
        400
      );
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
      })
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
      })
    );

    const allRatings = movieRatings.Items as MovieRating[];
    const newAvg =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: data.movie_id },
        UpdateExpression: "SET rating = :rating, updated_at = :updated",
        ExpressionAttributeValues: {
          ":rating": Math.round(newAvg * 10) / 10,
          ":updated": new Date().toISOString(),
        },
      })
    );

    return c.json(
      {
        success: true,
        data: rating,
        message: "Rating submitted successfully",
      },
      201
    );
  } catch (error) {
    console.error("Error creating rating:", error);
    return c.json({ success: false, error: "Failed to submit rating" }, 500);
  }
});

export default ratings;
