/**
 * Rooms Service Lambda Handler
 * Handles all room-related operations
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import roomsRoutes from "./routes";

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
  })
);

// Health check
app.get("/health", (c) => c.json({ service: "rooms", status: "ok" }));

// Mount routes at root since API Gateway routes to /rooms
app.route("/rooms", roomsRoutes);
app.route("/", roomsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[rooms]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "rooms",
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
      path: c.req.path,
      service: "rooms",
    },
    404
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3005,
  fetch: app.fetch,
};
