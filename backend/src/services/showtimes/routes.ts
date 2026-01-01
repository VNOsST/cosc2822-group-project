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

    const movie = movieResult.Item as Movie;

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

    // Calculate end time based on movie runtime
    const startTime = new Date(data.start_time);
    const endTime = new Date(startTime.getTime() + movie.runtime * 60000); // runtime is in minutes
    const endTimeISO = endTime.toISOString();

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

    const startTimeMs = startTime.getTime();
    const endTimeMs = endTime.getTime();

    const hasConflict = (conflictCheck.Items || []).some((item) => {
      const existingStart = new Date(item.start_time).getTime();
      const existingEnd = new Date(item.endtime).getTime();
      return (
        (startTimeMs >= existingStart && startTimeMs < existingEnd) ||
        (endTimeMs > existingStart && endTimeMs <= existingEnd) ||
        (startTimeMs <= existingStart && endTimeMs >= existingEnd)
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
      endtime: endTimeISO,
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

// POST /showtimes/bulk - Create multiple showtimes (admin)
showtimes.post("/bulk", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();

    // Validate that body is an array
    if (!Array.isArray(body)) {
      return c.json({ success: false, error: "Request body must be an array of showtimes" }, 400);
    }

    // Validate each showtime
    const validationResults = body.map((item) => createShowtimeSchema.safeParse(item));
    const hasErrors = validationResults.some((result) => !result.success);

    if (hasErrors) {
      const errors = validationResults
        .map((result, index) => (result.success ? null : { index, errors: result.error.errors }))
        .filter(Boolean);
      return c.json({ success: false, error: "Validation failed", details: errors }, 400);
    }

    const showtimesData = validationResults.map((result) => result.data!);

    // Verify all movies and rooms exist
    const movieIds = [...new Set(showtimesData.map((s) => s.movie_id))];
    const roomIds = [...new Set(showtimesData.map((s) => s.room_id))];

    // Check movies in parallel
    const movieChecks = await Promise.all(
      movieIds.map((id) =>
        docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.MOVIES,
            Key: { id },
          }),
        ),
      ),
    );

    const missingMovies = movieIds.filter((id, index) => !movieChecks[index].Item);
    if (missingMovies.length > 0) {
      return c.json(
        {
          success: false,
          error: `Movies not found: ${missingMovies.join(", ")}`,
        },
        404,
      );
    }

    // Check rooms in parallel
    const roomChecks = await Promise.all(
      roomIds.map((id) =>
        docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.ROOMS,
            Key: { room_id: id, sk: "METADATA" },
          }),
        ),
      ),
    );

    const missingRooms = roomIds.filter((id, index) => !roomChecks[index].Item);
    if (missingRooms.length > 0) {
      return c.json(
        {
          success: false,
          error: `Rooms not found: ${missingRooms.join(", ")}`,
        },
        404,
      );
    }

    // Get existing showtimes for each room to check conflicts
    const existingShowtimesByRoom = new Map<
      string,
      Array<{ start_time: string; endtime: string }>
    >();

    for (const roomId of roomIds) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          IndexName: "room_id-start_time-index",
          KeyConditionExpression: "room_id = :roomId",
          ExpressionAttributeValues: {
            ":roomId": roomId,
          },
        }),
      );
      existingShowtimesByRoom.set(
        roomId,
        (result.Items || []).map((item) => ({
          start_time: item.start_time,
          endtime: item.endtime,
        })),
      );
    }

    // Get movie data to calculate end times
    const movieDataMap = new Map<string, Movie>();
    movieChecks.forEach((check, index) => {
      if (check.Item) {
        movieDataMap.set(movieIds[index], check.Item as Movie);
      }
    });

    // Calculate end times for each showtime
    const showtimesWithEndTimes = showtimesData.map((data) => {
      const movie = movieDataMap.get(data.movie_id)!;
      const startTime = new Date(data.start_time);
      const endTime = new Date(startTime.getTime() + movie.runtime * 60000);
      return {
        ...data,
        endtime: endTime.toISOString(),
      };
    });

    // Check for conflicts (both with existing and within the batch)
    const conflicts: Array<{ index: number; reason: string }> = [];
    const newShowtimesByRoom = new Map<string, Array<{ start_time: string; endtime: string }>>();

    showtimesWithEndTimes.forEach((data, index) => {
      const startTime = new Date(data.start_time).getTime();
      const endTime = new Date(data.endtime).getTime();

      // Check against existing showtimes
      const existingShowtimes = existingShowtimesByRoom.get(data.room_id) || [];
      const hasExistingConflict = existingShowtimes.some((existing) => {
        const existingStart = new Date(existing.start_time).getTime();
        const existingEnd = new Date(existing.endtime).getTime();
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      });

      if (hasExistingConflict) {
        conflicts.push({ index, reason: "Conflicts with existing showtime" });
        return;
      }

      // Check against new showtimes in the same batch
      const newShowtimes = newShowtimesByRoom.get(data.room_id) || [];
      const hasNewConflict = newShowtimes.some((newShowtime) => {
        const newStart = new Date(newShowtime.start_time).getTime();
        const newEnd = new Date(newShowtime.endtime).getTime();
        return (
          (startTime >= newStart && startTime < newEnd) ||
          (endTime > newStart && endTime <= newEnd) ||
          (startTime <= newStart && endTime >= newEnd)
        );
      });

      if (hasNewConflict) {
        conflicts.push({ index, reason: "Conflicts with another showtime in this batch" });
        return;
      }

      // Add to tracking
      if (!newShowtimesByRoom.has(data.room_id)) {
        newShowtimesByRoom.set(data.room_id, []);
      }
      newShowtimesByRoom.get(data.room_id)!.push({
        start_time: data.start_time,
        endtime: data.endtime,
      });
    });

    if (conflicts.length > 0) {
      return c.json(
        {
          success: false,
          error: "Time conflicts detected",
          conflicts,
        },
        409,
      );
    }

    // Create all showtimes
    const createdShowtimes: Showtime[] = [];

    for (const data of showtimesWithEndTimes) {
      const showtimeId = `showtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

      createdShowtimes.push(showtime);
    }

    return c.json(
      {
        success: true,
        data: createdShowtimes,
        message: `Successfully created ${createdShowtimes.length} showtimes`,
        count: createdShowtimes.length,
      },
      201,
    );
  } catch (error) {
    console.error("[showtimes]", "Error creating bulk showtimes:", error);
    return c.json({ success: false, error: "Failed to create bulk showtimes" }, 500);
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

    const existingData = existingShowtime.Item as Showtime;

    // Check if primary keys are being changed
    const isPrimaryKeyChange =
      (data.movie_id && data.movie_id !== id) ||
      (data.start_time && data.start_time !== decodeURIComponent(startTime));

    if (isPrimaryKeyChange) {
      // Need to delete old item and create new one
      const newMovieId = data.movie_id || id;
      const newStartTime = data.start_time || decodeURIComponent(startTime);
      const newRoomId = data.room_id || existingData.room_id;
      const newPrice = data.price !== undefined ? data.price : existingData.price;

      // Verify new movie exists if changed
      if (data.movie_id && data.movie_id !== id) {
        const movieResult = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.MOVIES,
            Key: { id: data.movie_id },
          }),
        );

        if (!movieResult.Item) {
          return c.json({ success: false, error: "Movie not found" }, 404);
        }
      }

      // Verify new room exists if changed
      if (data.room_id && data.room_id !== existingData.room_id) {
        const roomResult = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.ROOMS,
            Key: { room_id: data.room_id, sk: "METADATA" },
          }),
        );

        if (!roomResult.Item) {
          return c.json({ success: false, error: "Room not found" }, 404);
        }
      }

      // Get movie for runtime calculation
      const movieResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: newMovieId },
        }),
      );

      const movie = movieResult.Item as Movie;
      const startTimeDate = new Date(newStartTime);
      const endTime = new Date(startTimeDate.getTime() + movie.runtime * 60000);
      const endTimeISO = endTime.toISOString();

      // Check for conflicts with the new time/room
      const conflictCheck = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          IndexName: "room_id-start_time-index",
          KeyConditionExpression: "room_id = :roomId",
          ExpressionAttributeValues: {
            ":roomId": newRoomId,
          },
        }),
      );

      const startTimeMs = startTimeDate.getTime();
      const endTimeMs = endTime.getTime();

      const hasConflict = (conflictCheck.Items || []).some((item) => {
        // Skip the current showtime being updated
        if (item.movie_id === id && item.start_time === decodeURIComponent(startTime)) {
          return false;
        }

        const existingStart = new Date(item.start_time).getTime();
        const existingEnd = new Date(item.endtime).getTime();
        return (
          (startTimeMs >= existingStart && startTimeMs < existingEnd) ||
          (endTimeMs > existingStart && endTimeMs <= existingEnd) ||
          (startTimeMs <= existingStart && endTimeMs >= existingEnd)
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

      // Delete old showtime
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          Key: {
            movie_id: id,
            start_time: decodeURIComponent(startTime),
          },
        }),
      );

      // Create new showtime with preserved data
      const newShowtime: Showtime = {
        movie_id: newMovieId,
        start_time: newStartTime,
        showtime_id: existingData.showtime_id, // Preserve showtime_id
        room_id: newRoomId,
        endtime: endTimeISO,
        price: newPrice,
        occupied_seats: existingData.occupied_seats || [], // Preserve bookings
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          Item: newShowtime,
        }),
      );

      return c.json({
        success: true,
        data: newShowtime,
        message: "Showtime updated successfully",
      });
    } else {
      // Simple update - no primary key change
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // If room_id or price is being updated, we need to recalculate endtime if movie changed
      if (data.room_id || data.price) {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
          }
        });
      }

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
    }
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
