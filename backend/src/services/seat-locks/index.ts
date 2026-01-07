/**
 * Seat Locks Service Lambda Handler
 * Manages temporary seat reservations using ElastiCache (Redis)
 */

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import seatLocksRoutes from "./routes";

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
app.get("/health", (c) => c.json({ service: "seat-locks", status: "ok" }));

// Mount routes - handle both /seat-locks and / paths
app.route("/seat-locks", seatLocksRoutes);
app.route("/", seatLocksRoutes);

// Error handling
app.onError((err, c) => {
    console.error("[seat-locks]", "Error:", err);
    return c.json(
        {
            success: false,
            error: "Internal server error",
            message: err.message,
            service: "seat-locks",
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
            service: "seat-locks",
        },
        404
    );
});

// Export Lambda handler
export const handler = handle(app);

// Export for local development
export default {
    port: 3006,
    fetch: app.fetch,
};
