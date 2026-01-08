import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import moviesRoutes from "./services/movies/routes";
import showtimesRoutes from "./services/showtimes/routes";
import roomsRoutes from "./services/rooms/routes";
import ratingsRoutes from "./services/ratings/routes";
import usersRoutes from "./services/users/routes";
import imagesRoutes from "./services/images/routes";
import adminNotificationsRoutes from "./services/admin-notifications/routes";
import notificationsRoutes from "./services/notifications/routes";

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
app.get("/health", (c) => c.json({ service: "public-api", status: "ok" }));

// Mount routes
app.route("/movies", moviesRoutes);
app.route("/showtimes", showtimesRoutes);
app.route("/rooms", roomsRoutes);
app.route("/ratings", ratingsRoutes);
app.route("/users", usersRoutes);
app.route("/images", imagesRoutes);
app.route("/admin/notifications", adminNotificationsRoutes);
app.route("/notifications", notificationsRoutes);

// Error handling
app.onError((err, c) => {
  console.error("[public-api]", "Error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
      service: "public-api",
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
      service: "public-api",
    },
    404,
  );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
  port: 3000,
  fetch: app.fetch,
};
