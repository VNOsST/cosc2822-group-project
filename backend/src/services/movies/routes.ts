/**
 * Movies Service Routes
 * Handles all movie-related API endpoints
 */
import { Hono } from "hono";
import { z } from "zod";
import {
  ScanCommand,
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { adminOnly, getUser } from "../../shared/middleware";
import type { Movie, Showtime } from "../../shared/types/entities";
import {
  createSyncJob,
  getSyncJob,
  getActiveSyncJob,
} from "../../shared/movie-sync/job-service";
import { enqueueMovieSyncJob } from "../../shared/movie-sync/queue-client";

const movies = new Hono();

// Validation schemas
const createMovieSchema = z.object({
  tmdb_id: z.string(),
  title: z.string().min(1),
  synopsis: z.string(),
  runtime: z.number().positive(),
  release_date: z.string(),
  poster_url: z.string(),
  image_urls: z.array(z.string()).optional().default([]),
  genres: z.array(z.string()),
  cast: z.array(z.string()),
  tmdb_popularity_score: z.number().optional().default(0),
});

const updateMovieSchema = createMovieSchema.partial();

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
      }),
    );

    return c.json({
      success: true,
      data: result.Items as Movie[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[movies]", "Error fetching movies:", error);
    return c.json({ success: false, error: "Failed to fetch movies" }, 500);
  }
});

// GET /movies/search - Search movies by title (must come before /:id)
movies.get("/search", async (c) => {
  const query = c.req.query("q")?.toLowerCase();
  const genre = c.req.query("genre")?.toLowerCase();

  if (!query && !genre) {
    return c.json({ success: false, error: "Search query or genre is required" }, 400);
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.MOVIES,
        FilterExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": "MOVIE",
        },
      }),
    );

    let movies = result.Items as Movie[];

    // Filter by search query
    if (query) {
      movies = movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query) || movie.synopsis.toLowerCase().includes(query),
      );
    }

    // Filter by genre
    if (genre) {
      movies = movies.filter((movie) => movie.genres.some((g) => g.toLowerCase().includes(genre)));
    }

    // Sort by rating
    movies.sort((a, b) => b.rating - a.rating);

    return c.json({
      success: true,
      data: movies,
      count: movies.length,
    });
  } catch (error) {
    console.error("[movies]", "Error searching movies:", error);
    return c.json({ success: false, error: "Failed to search movies" }, 500);
  }
});

// GET /movies/genres - Get list of all genres (must come before /:id)
movies.get("/genres", async (c) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.MOVIES,
        FilterExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": "MOVIE",
        },
      }),
    );

    const movies = result.Items as Movie[];
    const genresSet = new Set<string>();

    movies.forEach((movie) => {
      movie.genres.forEach((genre) => genresSet.add(genre));
    });

    const genres = Array.from(genresSet).sort();

    return c.json({
      success: true,
      data: genres,
      count: genres.length,
    });
  } catch (error) {
    console.error("[movies]", "Error fetching genres:", error);
    return c.json({ success: false, error: "Failed to fetch genres" }, 500);
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
      }),
    );

    if (!result.Item) {
      return c.json({ success: false, error: "Movie not found" }, 404);
    }

    return c.json({
      success: true,
      data: result.Item as Movie,
    });
  } catch (error) {
    console.error("[movies]", "Error fetching movie:", error);
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
      }),
    );

    return c.json({
      success: true,
      data: result.Items as Showtime[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[movies]", "Error fetching showtimes:", error);
    return c.json({ success: false, error: "Failed to fetch showtimes" }, 500);
  }
});

// POST /movies - Create a new movie (admin)
movies.post("/", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createMovieSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const movieId = crypto.randomUUID();

    const movie: Movie = {
      id: movieId,
      tmdb_id: data.tmdb_id,
      title: data.title,
      synopsis: data.synopsis,
      runtime: data.runtime,
      release_date: data.release_date,
      poster_url: data.poster_url,
      image_urls: data.image_urls,
      genres: data.genres,
      cast: data.cast,
      rating: 0, // Initial rating
      tmdb_popularity_score: data.tmdb_popularity_score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "MOVIE",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MOVIES,
        Item: movie,
      }),
    );

    return c.json(
      {
        success: true,
        data: movie,
        message: "Movie created successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[movies]", "Error creating movie:", error);
    return c.json({ success: false, error: "Failed to create movie" }, 500);
  }
});

// PUT /movies/:id - Update a movie (admin)
movies.put("/:id", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json();
    const validationResult = updateMovieSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;

    // Check if movie exists
    const existingMovie = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
      }),
    );

    if (!existingMovie.Item) {
      return c.json({ success: false, error: "Movie not found" }, 404);
    }

    // Build update expression dynamically
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

    // Always update updated_at
    updateExpressions.push("#updated_at = :updated_at");
    expressionAttributeNames["#updated_at"] = "updated_at";
    expressionAttributeValues[":updated_at"] = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    // Fetch updated movie
    const updatedMovie = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
      }),
    );

    return c.json({
      success: true,
      data: updatedMovie.Item as Movie,
      message: "Movie updated successfully",
    });
  } catch (error) {
    console.error("[movies]", "Error updating movie:", error);
    return c.json({ success: false, error: "Failed to update movie" }, 500);
  }
});

// DELETE /movies/:id - Delete a movie (admin)
movies.delete("/:id", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    // Check if movie exists
    const existingMovie = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
      }),
    );

    if (!existingMovie.Item) {
      return c.json({ success: false, error: "Movie not found" }, 404);
    }

    // Delete the movie
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id },
      }),
    );

    return c.json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("[movies]", "Error deleting movie:", error);
    return c.json({ success: false, error: "Failed to delete movie" }, 500);
  }
});

// POST /movies/sync - Trigger manual movie sync from TMDB (admin)
// Now uses async queue-based processing instead of synchronous execution
movies.post("/sync", adminOnly(), async (c) => {
  try {
    const user = getUser(c);
    const triggeredBy = user?.email || "unknown";

    console.log(`[movies] Manual sync triggered by ${triggeredBy}`);

    // Check for existing active sync job (deduplication)
    const activeJob = await getActiveSyncJob();
    if (activeJob) {
      console.log(
        `[movies] Active sync job already exists: ${activeJob.job_id} (status: ${activeJob.status})`,
      );
      return c.json({
        success: true,
        data: {
          job_id: activeJob.job_id,
          status: activeJob.status,
          created_at: activeJob.created_at,
          message: `A sync job is already ${activeJob.status}. Please wait for it to complete.`,
        },
      });
    }

    // Create a new sync job record
    const job = await createSyncJob(triggeredBy);

    // Enqueue the job to SQS for async processing
    await enqueueMovieSyncJob(job.job_id);

    console.log(`[movies] Sync job ${job.job_id} created and enqueued`);

    return c.json({
      success: true,
      data: {
        job_id: job.job_id,
        status: job.status,
        created_at: job.created_at,
        message: "Sync job has been queued and will be processed shortly.",
      },
    });
  } catch (error) {
    console.error("[movies]", "Error triggering sync:", error);
    return c.json(
      {
        success: false,
        error: `Failed to trigger sync: ${(error as Error).message}`,
      },
      500,
    );
  }
});

// GET /movies/sync/:jobId - Get sync job status (admin)
movies.get("/sync/:jobId", adminOnly(), async (c) => {
  try {
    const jobId = c.req.param("jobId");

    if (!jobId) {
      return c.json({ success: false, error: "Job ID is required" }, 400);
    }

    const job = await getSyncJob(jobId);

    if (!job) {
      return c.json({ success: false, error: "Sync job not found" }, 404);
    }

    return c.json({
      success: true,
      data: {
        job_id: job.job_id,
        status: job.status,
        triggered_by: job.triggered_by,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        result: job.result,
      },
    });
  } catch (error) {
    console.error("[movies]", "Error fetching sync job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch sync job status",
      },
      500,
    );
  }
});

export default movies;
