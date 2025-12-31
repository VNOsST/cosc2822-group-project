import { Hono } from "hono";
import { z } from "zod";
import {
  GetCommand,
  QueryCommand,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { adminOnly } from "../../shared/middleware";
import type { Showtime, Room, Movie, ShowtimeWithDetails } from "../../shared/types/entities";

const showtimes = new Hono();

// Validation schemas
const createShowtimeSchema = z.object({
  movie_id: z.string(),
  room_id: z.string(),
  start_time: z.string(),
  endtime: z.string(),
  price: z.number().positive(),
});

const updateShowtimeSchema = createShowtimeSchema.partial();

// GET /showtimes - List all showtimes (with optional filters)
showtimes.get("/", async (c) => {
  const date = c.req.query("date"); // Optional date filter (YYYY-MM-DD)
  const roomId = c.req.query("room_id"); // Optional room filter

  try {
    let result;

    if (roomId) {
      // Query by room using GSI
      result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          IndexName: "room_id-start_time-index",
          KeyConditionExpression: "room_id = :roomId",
          ExpressionAttributeValues: {
            ":roomId": roomId,
          },
        }),
      );
    } else {
      // Scan all showtimes
      result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
        }),
      );
    }

    let items = result.Items as Showtime[];

    // Filter by date if provided
    if (date) {
      items = items.filter((item) => item.start_time.startsWith(date));
    }

    // Sort by start_time
    items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Fetch movie and room details for each showtime
    const showtimesWithDetails: ShowtimeWithDetails[] = await Promise.all(
      items.map(async (showtime) => {
        // Fetch movie details
        const movieResult = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.MOVIES,
            Key: { id: showtime.movie_id },
          }),
        );

        // Fetch room details
        const roomResult = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.ROOMS,
            Key: { room_id: showtime.room_id, sk: "METADATA" },
          }),
        );

        return {
          ...showtime,
          movie: movieResult.Item as Movie,
          room: roomResult.Item as Room,
        };
      }),
    );

    return c.json({
      success: true,
      data: showtimesWithDetails,
      count: showtimesWithDetails.length,
    });
  } catch (error) {
    console.error("[showtimes]", "Error fetching showtimes:", error);
    return c.json({ success: false, error: "Failed to fetch showtimes" }, 500);
  }
});

// GET /showtimes/:id - Get showtime by ID (with seat map)
showtimes.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    // Query using showtime_id GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": id,
        },
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    const showtime = result.Items[0] as Showtime;

    // Fetch movie details
    const movieResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: showtime.movie_id },
      }),
    );

    // Fetch room details for seat layout
    const roomResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: showtime.room_id, sk: "METADATA" },
      }),
    );

    const movie = movieResult.Item as Movie | undefined;
    const room = roomResult.Item as Room | undefined;

    // Generate seat map
    let seatMap: {
      id: string;
      status: "available" | "occupied" | "unavailable";
    }[] = [];

    if (room) {
      const { rows, columns } = room.layout_config;
      const occupiedSeats = new Set(showtime.occupied_seats || []);
      const unavailableSeats = new Set(room.unavailable || []);

      for (let row = 0; row < rows; row++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C...
        for (let col = 1; col <= columns; col++) {
          const seatId = `${rowLetter}${col}`;
          let status: "available" | "occupied" | "unavailable" = "available";

          if (unavailableSeats.has(seatId)) {
            status = "unavailable";
          } else if (occupiedSeats.has(seatId)) {
            status = "occupied";
          }

          seatMap.push({ id: seatId, status });
        }
      }
    }

    return c.json({
      success: true,
      data: {
        ...showtime,
        movie,
        room,
        seatMap,
      },
    });
  } catch (error) {
    console.error("[showtimes]", "Error fetching showtime:", error);
    return c.json({ success: false, error: "Failed to fetch showtime" }, 500);
  }
});

// POST /showtimes - Create a new showtime (admin)
showtimes.post("/", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createShowtimeSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const showtimeId = `showtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Verify movie exists
    const movieResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MOVIES,
        Key: { id: data.movie_id },
      }),
    );

    if (!movieResult.Item) {
      return c.json({ success: false, error: "Movie not found" }, 404);
    }

    // Verify room exists
    const roomResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: data.room_id, sk: "METADATA" },
      }),
    );

    if (!roomResult.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }

    // Check for time conflicts in the same room
    const conflictCheck = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "room_id-start_time-index",
        KeyConditionExpression: "room_id = :roomId",
        ExpressionAttributeValues: {
          ":roomId": data.room_id,
        },
      }),
    );

    const startTime = new Date(data.start_time).getTime();
    const endTime = new Date(data.endtime).getTime();

    const hasConflict = (conflictCheck.Items || []).some((item) => {
      const existingStart = new Date(item.start_time).getTime();
      const existingEnd = new Date(item.endtime).getTime();
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (hasConflict) {
      return c.json(
        {
          success: false,
          error: "Time conflict with existing showtime in this room",
        },
        409,
      );
    }

    const showtime: Showtime = {
      movie_id: data.movie_id,
      start_time: data.start_time,
      showtime_id: showtimeId,
      room_id: data.room_id,
      endtime: data.endtime,
      price: data.price,
      occupied_seats: [],
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Item: showtime,
      }),
    );

    return c.json(
      {
        success: true,
        data: showtime,
        message: "Showtime created successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[showtimes]", "Error creating showtime:", error);
    return c.json({ success: false, error: "Failed to create showtime" }, 500);
  }
});

// PUT /showtimes/:id/schedule/:startTime - Update a showtime (admin)
showtimes.put("/:id/schedule/:startTime", adminOnly(), async (c) => {
  const { id, startTime } = c.req.param();

  try {
    const body = await c.req.json();
    const validationResult = updateShowtimeSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;

    // Check if showtime exists
    const existingShowtime = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: id,
          start_time: decodeURIComponent(startTime),
        },
      }),
    );

    if (!existingShowtime.Item) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      return c.json({ success: false, error: "No fields to update" }, 400);
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: id,
          start_time: decodeURIComponent(startTime),
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    // Fetch updated showtime
    const updatedShowtime = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: id,
          start_time: decodeURIComponent(startTime),
        },
      }),
    );

    return c.json({
      success: true,
      data: updatedShowtime.Item as Showtime,
      message: "Showtime updated successfully",
    });
  } catch (error) {
    console.error("[showtimes]", "Error updating showtime:", error);
    return c.json({ success: false, error: "Failed to update showtime" }, 500);
  }
});

// DELETE /showtimes/:id/schedule/:startTime - Delete a showtime (admin)
showtimes.delete("/:id/schedule/:startTime", adminOnly(), async (c) => {
  const { id, startTime } = c.req.param();

  try {
    // Check if showtime exists
    const existingShowtime = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: id,
          start_time: decodeURIComponent(startTime),
        },
      }),
    );

    if (!existingShowtime.Item) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    // Check if there are any bookings for this showtime
    const bookingsCheck = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": (existingShowtime.Item as Showtime).showtime_id,
        },
      }),
    );

    if (bookingsCheck.Items && bookingsCheck.Items.length > 0) {
      return c.json(
        {
          success: false,
          error: "Cannot delete showtime with existing bookings",
        },
        409,
      );
    }

    // Delete the showtime
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: id,
          start_time: decodeURIComponent(startTime),
        },
      }),
    );

    return c.json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error) {
    console.error("[showtimes]", "Error deleting showtime:", error);
    return c.json({ success: false, error: "Failed to delete showtime" }, 500);
  }
});

export default showtimes;
