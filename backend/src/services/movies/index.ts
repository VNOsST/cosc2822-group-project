/**
 * Movies Service Lambda Handler
 * Handles all movie-related operations
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import moviesRoutes from "./routes";

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
app.get("/health", (c) => c.json({ service: "movies", status: "ok" }));

// Mount routes at root since API Gateway routes to /movies
app.route("/", moviesRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[movies]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "movies",
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
      service: "movies",
    },
    404,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3002,
  fetch: app.fetch,
};
