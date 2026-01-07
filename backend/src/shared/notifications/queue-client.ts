import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { AdminEvent } from "./types";

// Initialize SQS client
// Note: When running in a VPC with VPC Endpoints, the AWS SDK automatically resolves
// the SQS endpoint DNS to the VPC endpoint Private IP if PrivateDnsEnabled is true.
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || process.env.DYNAMODB_REGION || "ap-southeast-2",
});

// Get queue URL from environment
const getQueueUrl = (): string => {
  const queueUrl = process.env.ADMIN_NOTIFICATION_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("ADMIN_NOTIFICATION_QUEUE_URL environment variable is not set");
  }
  return queueUrl;
};

/**
 * Enqueue an admin notification event to SQS
 * This replaces the direct SNS publish to avoid blocking the main lambda with formatting/publishing logic
 */
export async function enqueueAdminNotification(event: AdminEvent): Promise<void> {
  // Use Promise.race to enforce a strict timeout for the SQS operation
  // This ensures that even if the network hangs, the user experience isn't degraded
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error("SQS enqueue operation timed out")), 2000);
  });

  try {
    const queueUrl = getQueueUrl();
    
    console.log(`[sqs-client] Enqueuing ${event.type} event to SQS`);
    
    await Promise.race([
      sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(event),
        }),
      ),
      timeoutPromise
    ]);
    
    console.log(`[sqs-client] Successfully enqueued ${event.type} event`);
  } catch (error) {
    // Log but don't throw - notifications should not break the main flow
    console.error("[sqs-client] Failed to enqueue notification:", error);
  }
}
