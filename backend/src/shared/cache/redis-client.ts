/**
 * Redis Client Configuration for ElastiCache
 * Used for temporary seat locks and caching frequently accessed data
 */

import { createClient, type RedisClientType } from "redis";

// Environment configuration
const isLocalDevelopment = process.env.NODE_ENV === "development" || !process.env.AWS_REGION;
const redisEndpoint = process.env.REDIS_ENDPOINT || (isLocalDevelopment ? "localhost" : undefined);
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

// Seat lock configuration
export const SEAT_LOCK_TTL_SECONDS = 600; // 10 minutes
export const SEAT_LOCK_PREFIX = "seat_lock:";

let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client connection
 * Uses lazy initialization for Lambda cold starts
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (!redisEndpoint) {
    throw new Error("Redis endpoint not configured. Set REDIS_ENDPOINT environment variable.");
  }

  redisClient = createClient({
    socket: {
      host: redisEndpoint,
      port: redisPort,
      // ElastiCache connection settings
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 2) {
          console.error("[redis]", `Max reconnection attempts reached after ${retries} retries`);
          return new Error("Max reconnection attempts reached");
        }
        const delay = Math.min(retries * 500, 2000);
        console.log("[redis]", `Reconnecting in ${delay}ms (attempt ${retries + 1})`);
        return delay;
      },
    },
  });

  redisClient.on("error", (err) => {
    console.error("[redis]", "Connection error:", err);
  });

  redisClient.on("connect", () => {
    console.log("[redis]", "Connected to Redis");
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Generate Redis key for a seat lock
 * Format: seat_lock:{showtime_id}:{seat_id}
 */
export function getSeatLockKey(showtimeId: string, seatId: string): string {
  return `${SEAT_LOCK_PREFIX}${showtimeId}:${seatId}`;
}

/**
 * Generate Redis key pattern for all locks in a showtime
 * Format: seat_lock:{showtime_id}:*
 */
export function getShowtimeLockPattern(showtimeId: string): string {
  return `${SEAT_LOCK_PREFIX}${showtimeId}:*`;
}

/**
 * SeatLock data structure stored in Redis
 */
export interface SeatLockData {
  user_id: string;
  locked_at: string;
  expires_at: number;
  lock_id: string;
}

/**
 * Lock a seat for a user
 * Uses SET NX (only if not exists) for atomic locking
 * @returns lock_id if successful, null if seat already locked
 */
export async function lockSeat(
  showtimeId: string,
  seatId: string,
  userId: string,
): Promise<string | null> {
  const client = await getRedisClient();
  const key = getSeatLockKey(showtimeId, seatId);
  const lockId = crypto.randomUUID();
  const now = Date.now();

  const lockData: SeatLockData = {
    user_id: userId,
    locked_at: new Date(now).toISOString(),
    expires_at: now + SEAT_LOCK_TTL_SECONDS * 1000,
    lock_id: lockId,
  };

  // SET NX - Only set if key doesn't exist (atomic operation)
  const result = await client.set(key, JSON.stringify(lockData), {
    NX: true, // Only set if not exists
    EX: SEAT_LOCK_TTL_SECONDS, // Expire in 10 minutes
  });

  if (result === "OK") {
    return lockId;
  }

  // Check if existing lock belongs to same user
  const existingLock = await getSeatLock(showtimeId, seatId);
  if (existingLock && existingLock.user_id === userId) {
    // Extend the lock for the same user
    await client.set(
      key,
      JSON.stringify({
        ...existingLock,
        expires_at: now + SEAT_LOCK_TTL_SECONDS * 1000,
      }),
      {
        EX: SEAT_LOCK_TTL_SECONDS,
      },
    );
    return existingLock.lock_id;
  }

  return null; // Seat is locked by another user
}

/**
 * Lock multiple seats atomically
 * @returns Object with locked seats and lock_id, or null if any seat is unavailable
 */
export async function lockSeats(
  showtimeId: string,
  seatIds: string[],
  userId: string,
): Promise<{ lock_id: string; seats: string[]; expires_at: number } | null> {
  const client = await getRedisClient();
  const lockId = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SEAT_LOCK_TTL_SECONDS * 1000;

  // First check if all seats are available
  const checkPromises = seatIds.map(async (seatId) => {
    const key = getSeatLockKey(showtimeId, seatId);
    const existing = await client.get(key);
    if (existing) {
      const lock = JSON.parse(existing) as SeatLockData;
      // Allow if same user owns the lock
      return lock.user_id === userId;
    }
    return true; // Seat is available
  });

  const availability = await Promise.all(checkPromises);
  const allAvailable = availability.every((available) => available);

  if (!allAvailable) {
    return null;
  }

  // Lock all seats with the same lock_id
  const lockPromises = seatIds.map(async (seatId) => {
    const key = getSeatLockKey(showtimeId, seatId);
    const lockData: SeatLockData = {
      user_id: userId,
      locked_at: new Date(now).toISOString(),
      expires_at: expiresAt,
      lock_id: lockId,
    };
    await client.set(key, JSON.stringify(lockData), {
      EX: SEAT_LOCK_TTL_SECONDS,
    });
  });

  await Promise.all(lockPromises);

  return {
    lock_id: lockId,
    seats: seatIds,
    expires_at: expiresAt,
  };
}

/**
 * Get seat lock information
 */
export async function getSeatLock(
  showtimeId: string,
  seatId: string,
): Promise<SeatLockData | null> {
  const client = await getRedisClient();
  const key = getSeatLockKey(showtimeId, seatId);
  const data = await client.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as SeatLockData;
}

/**
 * Unlock a seat (only by the user who locked it)
 * @returns true if unlocked, false if lock doesn't exist or belongs to another user
 */
export async function unlockSeat(
  showtimeId: string,
  seatId: string,
  userId: string,
  lockId?: string,
): Promise<boolean> {
  const client = await getRedisClient();
  const key = getSeatLockKey(showtimeId, seatId);
  const existing = await client.get(key);

  if (!existing) {
    return true; // Already unlocked
  }

  const lock = JSON.parse(existing) as SeatLockData;

  // Verify ownership
  if (lock.user_id !== userId) {
    return false;
  }

  // Verify lock_id if provided
  if (lockId && lock.lock_id !== lockId) {
    return false;
  }

  await client.del(key);
  return true;
}

/**
 * Unlock multiple seats
 */
export async function unlockSeats(
  showtimeId: string,
  seatIds: string[],
  userId: string,
  lockId?: string,
): Promise<{ unlocked: string[]; failed: string[] }> {
  const results = await Promise.all(
    seatIds.map(async (seatId) => {
      const success = await unlockSeat(showtimeId, seatId, userId, lockId);
      return { seatId, success };
    }),
  );

  return {
    unlocked: results.filter((r) => r.success).map((r) => r.seatId),
    failed: results.filter((r) => !r.success).map((r) => r.seatId),
  };
}

/**
 * Get all locked seats for a showtime
 */
export async function getShowtimeLocks(showtimeId: string): Promise<Map<string, SeatLockData>> {
  const client = await getRedisClient();
  const pattern = getShowtimeLockPattern(showtimeId);
  const locks = new Map<string, SeatLockData>();

  // Use SCAN for production-safe iteration
  for await (const key of client.scanIterator({
    MATCH: pattern,
    COUNT: 100,
  })) {
    const data = await client.get(key);
    if (data) {
      // Extract seat_id from key: seat_lock:{showtime_id}:{seat_id}
      const seatId = key.split(":").pop()!;
      locks.set(seatId, JSON.parse(data) as SeatLockData);
    }
  }

  return locks;
}

/**
 * Extend lock expiration time
 */
export async function extendLock(
  showtimeId: string,
  seatId: string,
  userId: string,
  lockId: string,
): Promise<number | null> {
  const client = await getRedisClient();
  const key = getSeatLockKey(showtimeId, seatId);
  const existing = await client.get(key);

  if (!existing) {
    return null;
  }

  const lock = JSON.parse(existing) as SeatLockData;

  // Verify ownership
  if (lock.user_id !== userId || lock.lock_id !== lockId) {
    return null;
  }

  const now = Date.now();
  const newExpiresAt = now + SEAT_LOCK_TTL_SECONDS * 1000;

  lock.expires_at = newExpiresAt;
  await client.set(key, JSON.stringify(lock), {
    EX: SEAT_LOCK_TTL_SECONDS,
  });

  return newExpiresAt;
}

/**
 * Extend locks for multiple seats
 */
export async function extendLocks(
  showtimeId: string,
  seatIds: string[],
  userId: string,
  lockId: string,
): Promise<{
  extended: string[];
  failed: string[];
  expires_at: number | null;
}> {
  const results = await Promise.all(
    seatIds.map(async (seatId) => {
      const newExpiry = await extendLock(showtimeId, seatId, userId, lockId);
      return { seatId, newExpiry };
    }),
  );

  const extended = results.filter((r) => r.newExpiry !== null);
  const failed = results.filter((r) => r.newExpiry === null);

  return {
    extended: extended.map((r) => r.seatId),
    failed: failed.map((r) => r.seatId),
    expires_at: extended.length > 0 ? extended[0].newExpiry : null,
  };
}

/**
 * Validate that a user holds locks for specific seats
 * Used before confirming a booking
 */
export async function validateLocks(
  showtimeId: string,
  seatIds: string[],
  userId: string,
  lockId: string,
): Promise<{ valid: boolean; invalidSeats: string[] }> {
  const invalidSeats: string[] = [];

  for (const seatId of seatIds) {
    const lock = await getSeatLock(showtimeId, seatId);
    if (!lock || lock.user_id !== userId || lock.lock_id !== lockId) {
      invalidSeats.push(seatId);
    }
  }

  return {
    valid: invalidSeats.length === 0,
    invalidSeats,
  };
}

/**
 * Release locks after successful booking
 * Should be called after booking is confirmed
 */
export async function releaseLocksForBooking(showtimeId: string, seatIds: string[]): Promise<void> {
  const client = await getRedisClient();

  const deletePromises = seatIds.map((seatId) => {
    const key = getSeatLockKey(showtimeId, seatId);
    return client.del(key);
  });

  await Promise.all(deletePromises);
}
