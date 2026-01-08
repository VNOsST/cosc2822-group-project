/**
 * Admin Notifications Service Lambda Handler
 * Handles SNS subscription management for admin alerts
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import adminNotificationsRoutes from "./routes";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/health", (c) => c.json({ service: "admin-notifications", status: "ok" }));

// Mount routes - API Gateway routes to /admin/notifications
app.route("/admin/notifications", adminNotificationsRoutes);
app.route("/", adminNotificationsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[admin-notifications]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "admin-notifications",
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
      path: c.req.path,
      service: "admin-notifications",
    },
    404,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3007,
  fetch: app.fetch,
};
