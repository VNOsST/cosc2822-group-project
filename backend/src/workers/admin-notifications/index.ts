import { SQSEvent } from "aws-lambda";
import { publishToTopic } from "../../shared/notifications/sns-client";
import type { AdminEvent } from "../../shared/notifications/types";

/**
 * Admin Notification Worker
 * Processes SQS messages and publishes them to the SNS topic
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`[admin-notification-worker] Processing ${event.Records.length} records`);

  for (const record of event.Records) {
    try {
      const adminEvent = JSON.parse(record.body) as AdminEvent;

      console.log(`[admin-notification-worker] Processing event type: ${adminEvent.type}`);

      await publishToTopic(adminEvent);
    } catch (error) {
      console.error("[admin-notification-worker] Error processing record:", error);
      // We generally want to let SQS retry if it's a transient error,
      // but if JSON parse fails, we should probably just log and ignore to avoid poison pills.
      // For now, we'll swallow errors to prevent infinite loops of bad messages unless we implement DLQ.
    }
  }
};
