/**
 * Seat Locks Service Routes
 * Handles temporary seat reservation API endpoints using Redis/ElastiCache
 */

import { Hono } from "hono";
import { z } from "zod";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { requireAuth, getUser } from "../../shared/middleware";
import {
  lockSeats,
  unlockSeats,
  extendLocks,
  getShowtimeLocks,
  validateLocks,
  SEAT_LOCK_TTL_SECONDS,
  getRedisClient,
} from "../../shared/cache/redis-client";
import type { Showtime, Room } from "../../shared/types/entities";

const seatLocks = new Hono();

// Health check endpoint to test Redis connectivity
seatLocks.get("/health", async (c) => {
  try {
    const startTime = Date.now();
    const client = await getRedisClient();
    await client.ping();
    const latency = Date.now() - startTime;
    return c.json({
      success: true,
      redis: "connected",
      latency_ms: latency,
      endpoint: process.env.REDIS_ENDPOINT || "not configured",
    });
  } catch (error) {
    console.error("[seat-locks]", "Health check failed:", error);
    return c.json(
      {
        success: false,
        redis: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        endpoint: process.env.REDIS_ENDPOINT || "not configured",
      },
      503,
    );
  }
});

// Validation schemas
const lockSeatsSchema = z.object({
  showtime_id: z.string().min(1),
  seats: z.array(z.string()).min(1).max(10), // Max 10 seats per lock request
});

const unlockSeatsSchema = z.object({
  showtime_id: z.string().min(1),
  seats: z.array(z.string()).min(1),
  lock_id: z.string().optional(),
});

const extendLocksSchema = z.object({
  showtime_id: z.string().min(1),
  seats: z.array(z.string()).min(1),
  lock_id: z.string().min(1),
});

const validateLocksSchema = z.object({
  showtime_id: z.string().min(1),
  seats: z.array(z.string()).min(1),
  lock_id: z.string().min(1),
});

// POST /seat-locks/lock - Lock seats for checkout
seatLocks.post("/lock", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const validationResult = lockSeatsSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const { showtime_id, seats } = validationResult.data;

    // Verify showtime exists and get occupied seats
    const showtimeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": showtime_id,
        },
      }),
    );

    if (!showtimeResult.Items || showtimeResult.Items.length === 0) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    const showtime = showtimeResult.Items[0] as Showtime;
    const occupiedSeats = new Set(showtime.occupied_seats || []);

    // Get room to validate seat IDs
    const roomResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: showtime.room_id, sk: "METADATA" },
      }),
    );

    if (!roomResult.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }

    const room = roomResult.Item as Room;
    const unavailableSeats = new Set(room.unavailable || []);

    // Check if any requested seats are already booked
    const bookedSeats = seats.filter((seat) => occupiedSeats.has(seat));
    if (bookedSeats.length > 0) {
      return c.json(
        {
          success: false,
          error: "Some seats are already booked",
          booked_seats: bookedSeats,
        },
        409,
      );
    }

    // Check if any requested seats are unavailable
    const invalidSeats = seats.filter((seat) => unavailableSeats.has(seat));
    if (invalidSeats.length > 0) {
      return c.json(
        {
          success: false,
          error: "Some seats are unavailable",
          unavailable_seats: invalidSeats,
        },
        409,
      );
    }

    // Attempt to lock seats in Redis
    const lockResult = await lockSeats(showtime_id, seats, user.sub);

    if (!lockResult) {
      // Get current locks to show which seats are locked by others
      const currentLocks = await getShowtimeLocks(showtime_id);
      const lockedByOthers = seats.filter((seat) => {
        const lock = currentLocks.get(seat);
        return lock && lock.user_id !== user.sub;
      });

      return c.json(
        {
          success: false,
          error: "Some seats are currently locked by other users",
          locked_seats: lockedByOthers,
        },
        409,
      );
    }

    return c.json({
      success: true,
      data: {
        lock_id: lockResult.lock_id,
        seats: lockResult.seats,
        expires_at: lockResult.expires_at,
        ttl_seconds: SEAT_LOCK_TTL_SECONDS,
      },
      message: "Seats locked successfully",
    });
  } catch (error) {
    console.error("[seat-locks]", "Error locking seats:", error);
    return c.json({ success: false, error: "Failed to lock seats" }, 500);
  }
});

// POST /seat-locks/unlock - Release seat locks
seatLocks.post("/unlock", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const validationResult = unlockSeatsSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const { showtime_id, seats, lock_id } = validationResult.data;

    const result = await unlockSeats(showtime_id, seats, user.sub, lock_id);

    return c.json({
      success: true,
      data: result,
      message: "Seats unlocked",
    });
  } catch (error) {
    console.error("[seat-locks]", "Error unlocking seats:", error);
    return c.json({ success: false, error: "Failed to unlock seats" }, 500);
  }
});

// POST /seat-locks/extend - Extend lock duration
seatLocks.post("/extend", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const validationResult = extendLocksSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const { showtime_id, seats, lock_id } = validationResult.data;

    const result = await extendLocks(showtime_id, seats, user.sub, lock_id);

    if (result.extended.length === 0) {
      return c.json(
        {
          success: false,
          error: "No locks could be extended. Locks may have expired or belong to another user.",
          failed_seats: result.failed,
        },
        400,
      );
    }

    return c.json({
      success: true,
      data: {
        extended: result.extended,
        failed: result.failed,
        expires_at: result.expires_at,
        ttl_seconds: SEAT_LOCK_TTL_SECONDS,
      },
      message: result.failed.length > 0 ? "Some locks extended" : "All locks extended",
    });
  } catch (error) {
    console.error("[seat-locks]", "Error extending locks:", error);
    return c.json({ success: false, error: "Failed to extend locks" }, 500);
  }
});

// POST /seat-locks/validate - Validate locks before booking
seatLocks.post("/validate", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const validationResult = validateLocksSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const { showtime_id, seats, lock_id } = validationResult.data;

    const result = await validateLocks(showtime_id, seats, user.sub, lock_id);

    if (!result.valid) {
      return c.json(
        {
          success: false,
          error: "Lock validation failed",
          invalid_seats: result.invalidSeats,
        },
        400,
      );
    }

    return c.json({
      success: true,
      data: {
        valid: true,
        seats: seats,
      },
      message: "Locks are valid",
    });
  } catch (error) {
    console.error("[seat-locks]", "Error validating locks:", error);
    return c.json({ success: false, error: "Failed to validate locks" }, 500);
  }
});

// GET /seat-locks/showtime/:showtimeId - Get all locks for a showtime
seatLocks.get("/showtime/:showtimeId", async (c) => {
  try {
    const { showtimeId } = c.req.param();

    // Get occupied seats from DynamoDB
    const showtimeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": showtimeId,
        },
      }),
    );

    if (!showtimeResult.Items || showtimeResult.Items.length === 0) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    const showtime = showtimeResult.Items[0] as Showtime;

    // Get current locks from Redis
    const locks = await getShowtimeLocks(showtimeId);

    // Convert Map to array for JSON response
    const lockedSeats: Array<{ seat_id: string; expires_at: number }> = [];
    locks.forEach((lock, seatId) => {
      lockedSeats.push({
        seat_id: seatId,
        expires_at: lock.expires_at,
      });
    });

    return c.json({
      success: true,
      data: {
        showtime_id: showtimeId,
        occupied_seats: showtime.occupied_seats || [],
        locked_seats: lockedSeats,
      },
    });
  } catch (error) {
    console.error("[seat-locks]", "Error fetching showtime locks:", error);
    return c.json({ success: false, error: "Failed to fetch seat locks" }, 500);
  }
});

// GET /seat-locks/my-locks/:showtimeId - Get current user's locks for a showtime
seatLocks.get("/my-locks/:showtimeId", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const { showtimeId } = c.req.param();

    const locks = await getShowtimeLocks(showtimeId);

    // Filter to only user's locks
    const myLocks: Array<{
      seat_id: string;
      lock_id: string;
      expires_at: number;
    }> = [];
    locks.forEach((lock, seatId) => {
      if (lock.user_id === user.sub) {
        myLocks.push({
          seat_id: seatId,
          lock_id: lock.lock_id,
          expires_at: lock.expires_at,
        });
      }
    });

    return c.json({
      success: true,
      data: {
        showtime_id: showtimeId,
        locks: myLocks,
        ttl_seconds: SEAT_LOCK_TTL_SECONDS,
      },
    });
  } catch (error) {
    console.error("[seat-locks]", "Error fetching user locks:", error);
    return c.json({ success: false, error: "Failed to fetch user locks" }, 500);
  }
});

export default seatLocks;
