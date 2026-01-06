/**
 * Review Prompt Scheduled Lambda Handler
 *
 * This Lambda function runs every 15 minutes to:
 * 1. Find showtimes that ended approximately 1 hour ago
 * 2. Find users who had confirmed bookings for those showtimes
 * 3. Create an in-app notification for those users to leave a movie review
 */

import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ScheduledHandler } from "aws-lambda";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import type { Booking, Showtime, Movie } from "../../shared/types/entities";

// Configuration
const WINDOW_MINUTES = 15;
const DELAY_HOURS = 1;

export const handler: ScheduledHandler = async (event) => {
  console.log("[review-prompt] Starting review prompt check", JSON.stringify(event));

  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() - DELAY_HOURS * 60 * 60 * 1000);
    const windowStart = new Date(windowEnd.getTime() - WINDOW_MINUTES * 60 * 1000);

    console.log(
      `[review-prompt] Looking for showtimes ending between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
    );

    // 1. Fetch showtimes that ended in our target window
    // Since we don't have an index on endtime, we scan (assuming volume is manageable for this prototype)
    const showtimesResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        FilterExpression: "endtime BETWEEN :start AND :end",
        ExpressionAttributeValues: {
          ":start": windowStart.toISOString(),
          ":end": windowEnd.toISOString(),
        },
      }),
    );

    const showtimes = (showtimesResult.Items || []) as Showtime[];
    console.log(`[review-prompt] Found ${showtimes.length} showtimes in window`);

    for (const showtime of showtimes) {
      // 2. Fetch movie details for the notification message
      const movieResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: showtime.movie_id },
        }),
      );
      const movie = movieResult.Item as Movie;
      if (!movie) continue;

      // 3. Find all confirmed bookings for this showtime
      const bookingsResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.BOOKINGS,
          IndexName: "showtime_id-index",
          KeyConditionExpression: "showtime_id = :showtimeId",
          ExpressionAttributeValues: {
            ":showtimeId": showtime.showtime_id,
          },
        }),
      );

      const bookings = (bookingsResult.Items || []) as Booking[];
      console.log(
        `[review-prompt] Processing ${bookings.length} bookings for showtime ${showtime.showtime_id} (${movie.title})`,
      );

      for (const booking of bookings) {
        if (booking.status !== "confirmed") continue;

        // 4. Check if notification already exists for this user and showtime
        // This prevents duplicates if the job overlaps or retries
        const existingNotifications = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.NOTIFICATIONS,
            IndexName: "user_id-sent_at-index",
            KeyConditionExpression: "user_id = :userId",
            FilterExpression: "metadata.showtime_id = :showtimeId AND #type = :type",
            ExpressionAttributeNames: {
              "#type": "type",
            },
            ExpressionAttributeValues: {
              ":userId": booking.user_id,
              ":showtimeId": showtime.showtime_id,
              ":type": "rating_prompt",
            },
          }),
        );

        if (existingNotifications.Items && existingNotifications.Items.length > 0) {
          console.log(
            `[review-prompt] Notification already exists for user ${booking.user_id} and showtime ${showtime.showtime_id}`,
          );
          continue;
        }

        // 5. Create the notification
        const notificationId = crypto.randomUUID();
        const sentAt = new Date().toISOString();

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.NOTIFICATIONS,
            Item: {
              id: notificationId,
              user_id: booking.user_id,
              type: "rating_prompt",
              message: `Hope you enjoyed ${movie.title}! How would you rate it?`,
              sent_at: sentAt,
              read: false,
              metadata: {
                movie_id: movie.id,
                showtime_id: showtime.showtime_id,
                booking_id: booking.booking_id,
                movie_title: movie.title,
              },
            },
          }),
        );

        console.log(`[review-prompt] Created notification for user ${booking.user_id}`);
      }
    }

    console.log("[review-prompt] Finished review prompt check");
  } catch (error) {
    console.error("[review-prompt] Fatal error:", error);
    throw error;
  }
};

// Need to import GetCommand which was missing
import { GetCommand } from "@aws-sdk/lib-dynamodb";
