/**
 * Admin Notifications Routes
 * Endpoints for managing SNS subscriptions and testing admin alerts
 */

import { Hono } from "hono";
import { z } from "zod";
import { adminOnly, getUser } from "../../shared/middleware/auth";
import {
  subscribeEmail,
  unsubscribeEmail,
  unsubscribeByEmail,
  listSubscriptions,
  isEmailSubscribed,
  notifyAdmins,
} from "../../shared/notifications/sns-client";

const app = new Hono();

// Validation schemas
const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const unsubscribeSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    subscriptionArn: z.string().optional(),
  })
  .refine((data) => data.email || data.subscriptionArn, {
    message: "Either email or subscriptionArn must be provided",
  });

/**
 * POST /subscribe
 * Subscribe an email address to admin alerts
 * Requires admin authentication
 */
app.post("/subscribe", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const { email } = parsed.data;

    // Check if already subscribed
    const existing = await isEmailSubscribed(email);
    if (existing.subscribed) {
      return c.json({
        success: true,
        data: {
          email,
          status: existing.status,
          subscriptionArn: existing.subscriptionArn,
          message:
            existing.status === "pending"
              ? "Subscription pending - please check your email to confirm"
              : "Email is already subscribed",
        },
      });
    }

    // Create new subscription
    const subscriptionArn = await subscribeEmail(email);

    console.log(`[admin-notifications] Subscription created for ${email}`);

    return c.json({
      success: true,
      data: {
        email,
        subscriptionArn,
        status: "pending",
        message:
          "Confirmation email sent. Please check your inbox and click the confirmation link.",
      },
    });
  } catch (error) {
    console.error("[admin-notifications] Subscribe error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create subscription",
        message: (error as Error).message,
      },
      500,
    );
  }
});

/**
 * POST /unsubscribe
 * Unsubscribe from admin alerts
 * Requires admin authentication
 */
app.post("/unsubscribe", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const { email, subscriptionArn } = parsed.data;

    if (email) {
      await unsubscribeByEmail(email);
      console.log(`[admin-notifications] Unsubscribed by email: ${email}`);
      return c.json({
        success: true,
        data: {
          email,
          message: `Successfully unsubscribed ${email} from admin alerts`,
        },
      });
    } else if (subscriptionArn) {
      await unsubscribeEmail(subscriptionArn);
      console.log(`[admin-notifications] Unsubscribed by ARN: ${subscriptionArn}`);
      return c.json({
        success: true,
        data: {
          subscriptionArn,
          message: "Successfully unsubscribed from admin alerts using ARN",
        },
      });
    }

    return c.json({ success: false, error: "Internal logic error" }, 500);
  } catch (error) {
    console.error("[admin-notifications] Unsubscribe error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to unsubscribe",
        message: (error as Error).message,
      },
      500,
    );
  }
});

/**
 * GET /subscriptions
 * List all current subscriptions to the admin alerts topic
 * Requires admin authentication
 */
app.get("/subscriptions", adminOnly(), async (c) => {
  try {
    const subscriptions = await listSubscriptions();

    // Filter to only email subscriptions and format response
    const emailSubscriptions = subscriptions
      .filter((sub) => sub.Protocol === "email")
      .map((sub) => ({
        email: sub.Endpoint,
        subscriptionArn: sub.SubscriptionArn,
        status: sub.SubscriptionArn === "PendingConfirmation" ? "pending" : "confirmed",
      }));

    console.log(`[admin-notifications] Listed ${emailSubscriptions.length} subscriptions`);

    return c.json({
      success: true,
      data: emailSubscriptions,
      count: emailSubscriptions.length,
    });
  } catch (error) {
    console.error("[admin-notifications] List subscriptions error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list subscriptions",
        message: (error as Error).message,
      },
      500,
    );
  }
});

/**
 * POST /test
 * Send a test notification to all subscribed admins
 * Requires admin authentication
 */
app.post("/test", adminOnly(), async (c) => {
  try {
    const user = getUser(c);

    await notifyAdmins({
      type: "test_notification",
      message: "This is a test notification from CineCloud Admin Notifications system.",
      triggeredBy: user?.email || "Unknown Admin",
      timestamp: new Date().toISOString(),
    });

    console.log(`[admin-notifications] Test notification sent by ${user?.email}`);

    return c.json({
      success: true,
      data: {
        message: "Test notification sent successfully. Check your email inbox.",
        sentAt: new Date().toISOString(),
        triggeredBy: user?.email,
      },
    });
  } catch (error) {
    console.error("[admin-notifications] Test notification error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to send test notification",
        message: (error as Error).message,
      },
      500,
    );
  }
});

export default app;
