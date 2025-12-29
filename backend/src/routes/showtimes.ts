import { Hono } from "hono";
import {
  GetCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../db/client";
import type { Showtime, Room } from "../types/entities";

const showtimes = new Hono();

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
        })
      );
    } else {
      // Scan all showtimes
      result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
        })
      );
    }

    let items = result.Items as Showtime[];

    // Filter by date if provided
    if (date) {
      items = items.filter((item) => item.start_time.startsWith(date));
    }

    // Sort by start_time
    items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return c.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching showtimes:", error);
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
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    const showtime = result.Items[0] as Showtime;

    // Fetch room details for seat layout
    const roomResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: showtime.room_id, sk: "METADATA" },
      })
    );

    const room = roomResult.Item as Room | undefined;

    // Generate seat map
    let seatMap: { id: string; status: "available" | "occupied" | "unavailable" }[] = [];

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
        room,
        seatMap,
      },
    });
  } catch (error) {
    console.error("Error fetching showtime:", error);
    return c.json({ success: false, error: "Failed to fetch showtime" }, 500);
  }
});

export default showtimes;
