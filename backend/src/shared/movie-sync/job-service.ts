/**
 * Movie Sync Job Service
 * DynamoDB operations for managing sync job records
 */

import { v4 as uuidv4 } from "uuid";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../db/client";
import type { SyncJob, SyncJobResult, SyncJobStatus } from "./types";

const SYNC_JOBS_TABLE = TABLE_NAMES.SYNC_JOBS;

// TTL: 7 days from creation
const JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Create a new sync job record
 */
export async function createSyncJob(triggeredBy: string): Promise<SyncJob> {
  const now = new Date();
  const job: SyncJob = {
    job_id: uuidv4(),
    status: "queued",
    triggered_by: triggeredBy,
    created_at: now.toISOString(),
    ttl: Math.floor(now.getTime() / 1000) + JOB_TTL_SECONDS,
  };

  await docClient.send(
    new PutCommand({
      TableName: SYNC_JOBS_TABLE,
      Item: job,
    }),
  );

  console.log(`[job-service] Created sync job: ${job.job_id}`);
  return job;
}

/**
 * Get a sync job by ID
 */
export async function getSyncJob(jobId: string): Promise<SyncJob | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SYNC_JOBS_TABLE,
      Key: { job_id: jobId },
    }),
  );

  return (result.Item as SyncJob) || null;
}

/**
 * Update sync job status to 'running'
 */
export async function markJobRunning(jobId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SYNC_JOBS_TABLE,
      Key: { job_id: jobId },
      UpdateExpression: "SET #status = :status, started_at = :started_at",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "running" as SyncJobStatus,
        ":started_at": new Date().toISOString(),
      },
    }),
  );

  console.log(`[job-service] Marked job ${jobId} as running`);
}

/**
 * Update sync job status to 'completed' with result
 */
export async function markJobCompleted(jobId: string, result: SyncJobResult): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SYNC_JOBS_TABLE,
      Key: { job_id: jobId },
      UpdateExpression: "SET #status = :status, completed_at = :completed_at, #result = :result",
      ExpressionAttributeNames: {
        "#status": "status",
        "#result": "result",
      },
      ExpressionAttributeValues: {
        ":status": "completed" as SyncJobStatus,
        ":completed_at": new Date().toISOString(),
        ":result": result,
      },
    }),
  );

  console.log(`[job-service] Marked job ${jobId} as completed`);
}

/**
 * Update sync job status to 'failed' with error
 */
export async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SYNC_JOBS_TABLE,
      Key: { job_id: jobId },
      UpdateExpression: "SET #status = :status, completed_at = :completed_at, #result = :result",
      ExpressionAttributeNames: {
        "#status": "status",
        "#result": "result",
      },
      ExpressionAttributeValues: {
        ":status": "failed" as SyncJobStatus,
        ":completed_at": new Date().toISOString(),
        ":result": {
          newMoviesCreated: 0,
          ratingsUpdated: 0,
          errorCount: 1,
          errors: [errorMessage],
        },
      },
    }),
  );

  console.log(`[job-service] Marked job ${jobId} as failed: ${errorMessage}`);
}

/**
 * Check if there's a pending/running sync job (for deduplication)
 * Returns the active job if one exists, null otherwise
 */
export async function getActiveSyncJob(): Promise<SyncJob | null> {
  // Check for 'queued' jobs
  const queuedResult = await docClient.send(
    new QueryCommand({
      TableName: SYNC_JOBS_TABLE,
      IndexName: "status-created_at-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "queued",
      },
      Limit: 1,
      ScanIndexForward: false, // Most recent first
    }),
  );

  if (queuedResult.Items && queuedResult.Items.length > 0) {
    return queuedResult.Items[0] as SyncJob;
  }

  // Check for 'running' jobs
  const runningResult = await docClient.send(
    new QueryCommand({
      TableName: SYNC_JOBS_TABLE,
      IndexName: "status-created_at-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "running",
      },
      Limit: 1,
      ScanIndexForward: false,
    }),
  );

  if (runningResult.Items && runningResult.Items.length > 0) {
    return runningResult.Items[0] as SyncJob;
  }

  return null;
}
