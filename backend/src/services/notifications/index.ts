/**
 * User Notifications Service Lambda Handler
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import notificationsRoutes from "./routes";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/health", (c) => c.json({ service: "notifications", status: "ok" }));

// Mount routes
app.route("/notifications", notificationsRoutes);
app.route("/", notificationsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[notifications]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "notifications",
    },
    500,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3008,
  fetch: app.fetch,
};
