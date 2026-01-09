/**
 * Movie Sync Job Types
 * Types for async movie sync job processing
 */

export type SyncJobStatus = "queued" | "running" | "completed" | "failed";

export interface SyncJobResult {
  newMoviesCreated: number;
  ratingsUpdated: number;
  errorCount: number;
  errors?: Array<string>;
  duration?: string;
}

export interface SyncJob {
  job_id: string;
  status: SyncJobStatus;
  triggered_by: string; // Admin email who triggered the sync
  created_at: string; // ISO datetime
  started_at?: string; // ISO datetime - when worker picked it up
  completed_at?: string; // ISO datetime - when sync finished
  result?: SyncJobResult;
  ttl: number; // Unix timestamp for auto-deletion
}

export interface SyncJobMessage {
  job_id: string;
}
