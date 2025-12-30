/**
 * Bookings Service Lambda Handler
 * Handles all booking-related operations
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import bookingsRoutes from "./routes";

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
app.get("/health", (c) => c.json({ service: "bookings", status: "ok" }));

// Mount routes at root since API Gateway routes to /bookings
app.route("/", bookingsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[bookings]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "bookings",
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
      service: "bookings",
    },
    404,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3004,
  fetch: app.fetch,
};
