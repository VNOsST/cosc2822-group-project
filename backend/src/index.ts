import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { handle } from "hono/aws-lambda";

import movies from "./routes/movies";
import showtimes from "./routes/showtimes";
import bookings from "./routes/bookings";
import rooms from "./routes/rooms";
import ratings from "./routes/ratings";

// Detect if running in Lambda environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    // In Lambda, allow all origins (API Gateway handles CORS)
    // In local dev, restrict to specific origins
    origin: isLambda ? "*" : ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "CineCloud API",
    version: "1.0.0",
    status: "healthy",
    ...(isLambda && { environment: "lambda" }),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount routes
app.route("/movies", movies);
app.route("/showtimes", showtimes);
app.route("/bookings", bookings);
app.route("/rooms", rooms);
app.route("/ratings", ratings);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
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
    },
    404
  );
});

// Conditional exports based on environment
// Export Lambda handler (always available, but only used in Lambda)
export const handler = handle(app);

// Log startup messages only in local development
if (!isLambda) {
  const port = parseInt(process.env.PORT || "3001");
  
  console.log(`🚀 CineCloud API server starting on port ${port}...`);
  console.log(`📍 DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT || "http://localhost:8000"}`);
}

// Always export the default for Bun/local development
export default {
  port: parseInt(process.env.PORT || "3001"),
  fetch: app.fetch,
};
