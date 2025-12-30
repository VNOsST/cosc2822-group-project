/**
 * Ratings Service Lambda Handler
 * Handles all rating-related operations
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import ratingsRoutes from "./routes";

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
app.get("/health", (c) => c.json({ service: "ratings", status: "ok" }));

// Mount routes at root since API Gateway routes to /ratings
app.route("/ratings", ratingsRoutes);
app.route("/", ratingsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[ratings]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "ratings",
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
      service: "ratings",
    },
    404,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3006,
  fetch: app.fetch,
};
