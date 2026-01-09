/**
 * Movie Sync Queue Client
 * SQS operations for enqueuing sync job messages
 */

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { SyncJobMessage } from "./types";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || process.env.DYNAMODB_REGION || "ap-southeast-2",
});

const getQueueUrl = (): string => {
  const queueUrl = process.env.MOVIE_SYNC_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("MOVIE_SYNC_QUEUE_URL environment variable is not set");
  }
  return queueUrl;
};

/**
 * Enqueue a movie sync job to SQS FIFO queue
 * Uses job_id as deduplication ID and message group ID
 */
export async function enqueueMovieSyncJob(jobId: string): Promise<void> {
  const queueUrl = getQueueUrl();

  const message: SyncJobMessage = {
    job_id: jobId,
  };

  console.log(`[movie-sync-queue] Enqueuing job ${jobId} to SQS`);

  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      // FIFO queue requires MessageGroupId
      // Using a constant to ensure all sync jobs are processed in order
      MessageGroupId: "movie-sync",
      // Content-based deduplication is enabled, but we can still provide explicit ID
      MessageDeduplicationId: jobId,
    }),
  );

  console.log(`[movie-sync-queue] Successfully enqueued job ${jobId}`);
}
