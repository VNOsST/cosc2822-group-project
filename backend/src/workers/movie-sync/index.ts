/**
 * Movie Sync Worker
 * Processes SQS messages to run movie sync jobs asynchronously
 */

import type { SQSEvent } from "aws-lambda";
import { runMovieSync } from "../../scheduled/movie-sync";
import {
  getSyncJob,
  markJobRunning,
  markJobCompleted,
  markJobFailed,
} from "../../shared/movie-sync/job-service";
import type { SyncJobMessage } from "../../shared/movie-sync/types";

/**
 * SQS Event Handler for Movie Sync Worker
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(
    `[movie-sync-worker] Processing ${event.Records.length} records`,
  );

  for (const record of event.Records) {
    const startTime = Date.now();
    let jobId: string | undefined;

    try {
      // Parse the SQS message
      const message = JSON.parse(record.body) as SyncJobMessage;
      jobId = message.job_id;

      console.log(`[movie-sync-worker] Processing job: ${jobId}`);

      // Verify job exists and is in queued status
      const job = await getSyncJob(jobId);
      if (!job) {
        console.error(`[movie-sync-worker] Job ${jobId} not found`);
        continue;
      }

      if (job.status !== "queued") {
        console.log(
          `[movie-sync-worker] Job ${jobId} is not queued (status: ${job.status}), skipping`,
        );
        continue;
      }

      // Mark job as running
      await markJobRunning(jobId);

      // Execute the sync
      console.log(`[movie-sync-worker] Starting sync for job ${jobId}`);
      const result = await runMovieSync();

      // Calculate duration
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Mark job as completed
      await markJobCompleted(jobId, {
        newMoviesCreated: result.newMoviesCreated,
        ratingsUpdated: result.ratingsUpdated,
        errorCount: result.errors.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
        duration: `${duration}s`,
      });

      console.log(
        `[movie-sync-worker] Job ${jobId} completed successfully in ${duration}s`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[movie-sync-worker] Error processing job:`, error);

      // Mark job as failed if we have a job ID
      if (jobId) {
        try {
          await markJobFailed(jobId, errorMessage);
        } catch (updateError) {
          console.error(
            `[movie-sync-worker] Failed to update job status:`,
            updateError,
          );
        }
      }

      // Don't throw - let the message be deleted to avoid infinite retries
      // The job status is already marked as failed in DynamoDB
    }
  }
};
