/**
 * SNS Client for Admin Notifications
 *
 * This module provides a wrapper around AWS SNS for publishing admin notification events.
 * All admin alerts are published to a single SNS topic that admins can subscribe to.
 */

import {
  SNSClient,
  PublishCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsByTopicCommand,
  type Subscription,
} from "@aws-sdk/client-sns";
import type {
  AdminEvent,
  BookingCancelledEvent,
  BookingCreatedEvent,
  UserRegisteredEvent,
  LowSeatAvailabilityEvent,
  TestNotificationEvent,
} from "./types";

import { enqueueAdminNotification } from "./queue-client";

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || process.env.DYNAMODB_REGION || "ap-southeast-2",
});

// Get topic ARN from environment
const getTopicArn = (): string => {
  const topicArn = process.env.ADMIN_ALERTS_TOPIC_ARN;
  if (!topicArn) {
    throw new Error("ADMIN_ALERTS_TOPIC_ARN environment variable is not set");
  }
  return topicArn;
};

/**
 * Format event into human-readable email content
 */
function formatEventMessage(event: AdminEvent): { subject: string; body: string } {
  const divider = "─".repeat(50);

  switch (event.type) {
    case "booking_cancelled": {
      const e = event as BookingCancelledEvent;
      return {
        subject: `[CineCloud] Booking Cancelled - ${e.movieTitle}`,
        body: `
BOOKING CANCELLED
${divider}

Booking ID: ${e.bookingId}
User: ${e.userEmail}
Movie: ${e.movieTitle}
Showtime: ${e.showtime}
Room: ${e.roomName}
Seats: ${e.seats.join(", ")}
Refund Amount: $${e.refundAmount.toFixed(2)}
Cancelled At: ${e.timestamp}

${divider}
CineCloud Admin Notifications
`.trim(),
      };
    }

    case "booking_created": {
      const e = event as BookingCreatedEvent;
      return {
        subject: `[CineCloud] New Booking - ${e.movieTitle}`,
        body: `
NEW BOOKING
${divider}

Booking ID: ${e.bookingId}
User: ${e.userEmail}
Movie: ${e.movieTitle}
Showtime: ${e.showtime}
Room: ${e.roomName}
Seats: ${e.seats.join(", ")}
Total Amount: $${e.totalAmount.toFixed(2)}
Booked At: ${e.timestamp}

${divider}
CineCloud Admin Notifications
`.trim(),
      };
    }

    case "user_registered": {
      const e = event as UserRegisteredEvent;
      return {
        subject: `[CineCloud] New User Registered - ${e.userName}`,
        body: `
NEW USER REGISTERED
${divider}

User ID: ${e.userId}
Name: ${e.userName}
Email: ${e.userEmail}
Registered At: ${e.timestamp}

${divider}
CineCloud Admin Notifications
`.trim(),
      };
    }

    case "low_seat_availability": {
      const e = event as LowSeatAvailabilityEvent;
      return {
        subject: `[CineCloud] Low Availability Alert - ${e.movieTitle}`,
        body: `
LOW SEAT AVAILABILITY ALERT
${divider}

Movie: ${e.movieTitle}
Showtime: ${e.showtime}
Room: ${e.roomName}
Remaining Seats: ${e.remainingSeats} of ${e.totalCapacity}
Capacity Filled: ${e.percentageFilled}%

Consider adding another showtime or promoting alternative times.

${divider}
CineCloud Admin Notifications
`.trim(),
      };
    }

    case "test_notification": {
      const e = event as TestNotificationEvent;
      return {
        subject: "[CineCloud] Test Notification",
        body: `
TEST NOTIFICATION
${divider}

${e.message}

Triggered By: ${e.triggeredBy}
Sent At: ${e.timestamp}

If you received this email, your subscription is working correctly!

${divider}
CineCloud Admin Notifications
`.trim(),
      };
    }

    default:
      return {
        subject: "[CineCloud] Admin Notification",
        body: `Event: ${JSON.stringify(event, null, 2)}`,
      };
  }
}

/**
 * Publish an admin notification event directly to SNS
 * Used by the worker function
 */
export async function publishToTopic(event: AdminEvent): Promise<void> {
  try {
    const topicArn = getTopicArn();
    const { subject, body } = formatEventMessage(event);

    console.log(`[sns-client] Publishing ${event.type} event to SNS`);

    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: subject,
        Message: body,
        MessageAttributes: {
          eventType: {
            DataType: "String",
            StringValue: event.type,
          },
        },
      }),
    );

    console.log(`[sns-client] Successfully published ${event.type} event`);
  } catch (error) {
    console.error("[sns-client] Failed to publish notification:", error);
    throw error; // Throw so SQS can retry
  }
}

/**
 * Queue an admin notification to be processed asynchronously
 * @deprecated Use notifyAdmins instead, which now uses the queue
 */
export const notifyAdmins = enqueueAdminNotification;

/**
 * Subscribe an email to the admin alerts topic
 * Returns the subscription ARN (pending confirmation)
 */
export async function subscribeEmail(email: string): Promise<string> {
  const topicArn = getTopicArn();

  console.log(`[sns-client] Subscribing ${email} to admin alerts`);

  const result = await snsClient.send(
    new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: "email",
      Endpoint: email,
      ReturnSubscriptionArn: true,
    }),
  );

  console.log(`[sns-client] Subscription created: ${result.SubscriptionArn}`);
  return result.SubscriptionArn || "pending confirmation";
}

/**
 * Unsubscribe from the admin alerts topic
 */
export async function unsubscribeEmail(subscriptionArn: string): Promise<void> {
  console.log(`[sns-client] Unsubscribing: ${subscriptionArn}`);

  await snsClient.send(
    new UnsubscribeCommand({
      SubscriptionArn: subscriptionArn,
    }),
  );

  console.log(`[sns-client] Successfully unsubscribed`);
}

/**
 * Unsubscribe an email address from the admin alerts topic
 */
export async function unsubscribeByEmail(email: string): Promise<void> {
  const status = await isEmailSubscribed(email);

  if (!status.subscribed || !status.subscriptionArn) {
    throw new Error(`Email ${email} is not subscribed to admin alerts`);
  }

  if (status.status === "pending" || status.subscriptionArn === "PendingConfirmation") {
    throw new Error(
      `Cannot unsubscribe ${email} because the subscription is still pending confirmation. Please confirm or wait for it to expire.`,
    );
  }

  await unsubscribeEmail(status.subscriptionArn);
}

/**
 * List all subscriptions to the admin alerts topic
 */
export async function listSubscriptions(): Promise<Array<Subscription>> {
  const topicArn = getTopicArn();

  console.log(`[sns-client] Listing subscriptions for topic`);

  const result = await snsClient.send(
    new ListSubscriptionsByTopicCommand({
      TopicArn: topicArn,
    }),
  );

  return result.Subscriptions || [];
}

/**
 * Check if an email is already subscribed
 */
export async function isEmailSubscribed(email: string): Promise<{
  subscribed: boolean;
  subscriptionArn?: string;
  status?: string;
}> {
  const subscriptions = await listSubscriptions();

  const subscription = subscriptions.find(
    (sub) => sub.Protocol === "email" && sub.Endpoint === email,
  );

  if (!subscription) {
    return { subscribed: false };
  }

  return {
    subscribed: true,
    subscriptionArn: subscription.SubscriptionArn,
    status: subscription.SubscriptionArn === "PendingConfirmation" ? "pending" : "confirmed",
  };
}

// Export the client for advanced usage
export { snsClient };
