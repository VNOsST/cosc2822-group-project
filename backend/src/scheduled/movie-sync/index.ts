/**
 * Movie Sync Scheduled Lambda Handler
 *
 * This Lambda function runs daily to:
 * 1. Fetch new movies from TMDB API (now playing + upcoming)
 * 2. Create new movies in DynamoDB if they don't exist
 * 3. Update ratings for movies released within the last month
 *
 * Schedule: Daily at 2:00 AM UTC (12:00 PM AEST)
 */

import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ScheduledHandler } from "aws-lambda";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { TMDBClient } from "./tmdb-client";
import { uploadImageToS3, uploadImagesToS3 } from "./s3-storage";
import type { Movie } from "../../shared/types/entities";

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const MOVIES_TO_FETCH_PER_LIST = 2; // Number of pages to fetch from each list
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface SyncResult {
  newMoviesCreated: number;
  ratingsUpdated: number;
  errors: string[];
}

/**
 * Check if a movie exists in the database by TMDB ID
 */
async function getMovieByTmdbId(tmdbId: string): Promise<Movie | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MOVIES,
        IndexName: "tmdb_id-index",
        KeyConditionExpression: "tmdb_id = :tmdbId",
        ExpressionAttributeValues: {
          ":tmdbId": tmdbId,
        },
        Limit: 1,
      }),
    );

    return (result.Items?.[0] as Movie) || null;
  } catch (error) {
    console.error("[movie-sync] Error checking movie existence:", error);
    return null;
  }
}

/**
 * Create a new movie in the database
 */
async function createMovie(tmdbClient: TMDBClient, tmdbMovieId: number): Promise<boolean> {
  try {
    // Get detailed movie information
    const details = await tmdbClient.getMovieDetails(tmdbMovieId);

    // Skip movies without essential data
    if (!details.runtime || !details.release_date) {
      console.log(`[movie-sync] Skipping movie ${details.title} - missing runtime or release date`);
      return false;
    }

    const movieId = crypto.randomUUID();
    const now = new Date().toISOString();
    const tmdbIdStr = details.id.toString();

    // Upload poster to S3
    const originalPosterUrl = TMDBClient.getPosterUrl(details.poster_path);
    const posterResult = await uploadImageToS3(originalPosterUrl, tmdbIdStr, "poster");
    const posterUrl = posterResult?.url || originalPosterUrl;

    // Upload backdrop images to S3
    const originalImageUrls = TMDBClient.getImageUrls(details.images);
    const imageUrls = await uploadImagesToS3(originalImageUrls, tmdbIdStr, "backdrop");

    const movie: Movie = {
      id: movieId,
      tmdb_id: tmdbIdStr,
      title: details.title,
      synopsis: details.overview || "",
      runtime: details.runtime,
      release_date: details.release_date,
      poster_url: posterUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : originalImageUrls,
      genres: TMDBClient.getGenreNamesFromArray(details.genres || []),
      cast: TMDBClient.getTopCast(details.credits),
      rating: details.vote_average,
      tmdb_popularity_score: details.popularity,
      created_at: now,
      updated_at: now,
      type: "MOVIE",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MOVIES,
        Item: movie,
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );

    console.log(`[movie-sync] Created new movie: ${movie.title} (${movie.tmdb_id})`);
    return true;
  } catch (error) {
    if ((error as Error).name === "ConditionalCheckFailedException") {
      console.log(`[movie-sync] Movie already exists, skipping`);
      return false;
    }
    console.error(`[movie-sync] Error creating movie ${tmdbMovieId}:`, error);
    return false;
  }
}

/**
 * Update rating for an existing movie
 */
async function updateMovieRating(tmdbClient: TMDBClient, movie: Movie): Promise<boolean> {
  try {
    const { vote_average, popularity } = await tmdbClient.getMovieRating(parseInt(movie.tmdb_id));

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: movie.id },
        UpdateExpression:
          "SET rating = :rating, tmdb_popularity_score = :popularity, updated_at = :updatedAt",
        ExpressionAttributeValues: {
          ":rating": vote_average,
          ":popularity": popularity,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );

    console.log(
      `[movie-sync] Updated rating for ${movie.title}: ${movie.rating} -> ${vote_average}`,
    );
    return true;
  } catch (error) {
    console.error(`[movie-sync] Error updating rating for ${movie.title}:`, error);
    return false;
  }
}

/**
 * Check if a movie was released within the last month
 */
function isReleasedWithinLastMonth(releaseDate: string): boolean {
  const release = new Date(releaseDate);
  const now = new Date();
  const diffMs = now.getTime() - release.getTime();

  // Only update if released within the last 30 days and already released
  return diffMs >= 0 && diffMs <= ONE_MONTH_MS;
}

/**
 * Fetch and sync movies from TMDB
 */
async function syncNewMovies(
  tmdbClient: TMDBClient,
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  try {
    // Fetch now playing and upcoming movies
    const movieLists = await Promise.all([
      ...Array.from({ length: MOVIES_TO_FETCH_PER_LIST }, (_, i) =>
        tmdbClient.getNowPlaying(i + 1),
      ),
      ...Array.from({ length: MOVIES_TO_FETCH_PER_LIST }, (_, i) => tmdbClient.getUpcoming(i + 1)),
    ]);

    // Collect unique movie IDs
    const movieIds = new Set<number>();
    for (const list of movieLists) {
      for (const movie of list.results) {
        movieIds.add(movie.id);
      }
    }

    console.log(`[movie-sync] Found ${movieIds.size} unique movies from TMDB`);

    // Process each movie
    for (const tmdbId of Array.from(movieIds)) {
      // Check if movie already exists
      const existingMovie = await getMovieByTmdbId(tmdbId.toString());

      if (existingMovie) {
        console.log(`[movie-sync] Movie ${existingMovie.title} already exists, skipping`);
        continue;
      }

      // Create new movie
      const success = await createMovie(tmdbClient, tmdbId);
      if (success) {
        created++;
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } catch (error) {
    const errorMsg = `Error syncing new movies: ${(error as Error).message}`;
    console.error("[movie-sync]", errorMsg);
    errors.push(errorMsg);
  }

  return { created, errors };
}

/**
 * Update ratings for recently released movies
 */
async function updateRecentMovieRatings(
  tmdbClient: TMDBClient,
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Scan all movies
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

    const movies = (result.Items || []) as Movie[];
    console.log(`[movie-sync] Checking ${movies.length} movies for rating updates`);

    // Filter movies released within the last month
    const recentMovies = movies.filter((movie) => isReleasedWithinLastMonth(movie.release_date));
    console.log(`[movie-sync] Found ${recentMovies.length} movies released within the last month`);

    // Update ratings for recent movies
    for (const movie of recentMovies) {
      const success = await updateMovieRating(tmdbClient, movie);
      if (success) {
        updated++;
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } catch (error) {
    const errorMsg = `Error updating movie ratings: ${(error as Error).message}`;
    console.error("[movie-sync]", errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

/**
 * Core sync function - can be called from Lambda handler or API endpoint
 */
export async function runMovieSync(): Promise<SyncResult> {
  console.log("[movie-sync] Starting movie sync job");

  // Validate TMDB API key
  if (!TMDB_API_KEY) {
    console.error("[movie-sync] TMDB_API_KEY environment variable is not set");
    throw new Error("TMDB_API_KEY is required");
  }

  const tmdbClient = new TMDBClient(TMDB_API_KEY);
  const result: SyncResult = {
    newMoviesCreated: 0,
    ratingsUpdated: 0,
    errors: [],
  };

  try {
    // Step 1: Sync new movies from TMDB
    console.log("[movie-sync] Step 1: Syncing new movies from TMDB...");
    const syncResult = await syncNewMovies(tmdbClient);
    result.newMoviesCreated = syncResult.created;
    result.errors.push(...syncResult.errors);

    // Step 2: Update ratings for recently released movies
    console.log("[movie-sync] Step 2: Updating ratings for recent movies...");
    const ratingResult = await updateRecentMovieRatings(tmdbClient);
    result.ratingsUpdated = ratingResult.updated;
    result.errors.push(...ratingResult.errors);

    console.log("[movie-sync] Sync completed:", {
      newMoviesCreated: result.newMoviesCreated,
      ratingsUpdated: result.ratingsUpdated,
      errorCount: result.errors.length,
    });

    if (result.errors.length > 0) {
      console.warn("[movie-sync] Errors encountered:", result.errors);
    }
  } catch (error) {
    console.error("[movie-sync] Fatal error:", error);
    throw error;
  }

  return result;
}

/**
 * Main Lambda handler
 */
export const handler: ScheduledHandler = async (event) => {
  console.log("[movie-sync] Event:", JSON.stringify(event));
  await runMovieSync();
};
