import { Hono } from "hono";
import {
  ScanCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../db/client";
import type { Movie, Showtime } from "../types/entities";

const movies = new Hono();

// GET /movies - List all movies sorted by rating
movies.get("/", async (c) => {
  try {
    // Use GSI to get movies sorted by rating
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIES,
        IndexName: "type-rating-index",
        KeyConditionExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": "MOVIE",
        },
        ScanIndexForward: false, // Descending order (highest rating first)
      })
    );

    return c.json({
      success: true,
      data: result.Items as Movie[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return c.json({ success: false, error: "Failed to fetch movies" }, 500);
  }
});

// GET /movies/:id - Get movie details
movies.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
      })
    );

    if (!result.Item) {
      return c.json({ success: false, error: "Movie not found" }, 404);
    }

    return c.json({
      success: true,
      data: result.Item as Movie,
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    return c.json({ success: false, error: "Failed to fetch movie" }, 500);
  }
});

// GET /movies/:id/showtimes - Get showtimes for a movie
movies.get("/:id/showtimes", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        KeyConditionExpression: "movie_id = :movieId",
        ExpressionAttributeValues: {
          ":movieId": id,
        },
        ScanIndexForward: true, // Ascending order (earliest first)
      })
    );

    return c.json({
      success: true,
      data: result.Items as Showtime[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("Error fetching showtimes:", error);
    return c.json({ success: false, error: "Failed to fetch showtimes" }, 500);
  }
});

export default movies;
