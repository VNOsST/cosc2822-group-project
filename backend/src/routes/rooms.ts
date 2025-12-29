import { Hono } from "hono";
import { z } from "zod";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../db/client";
import type { Room } from "../types/entities";

const rooms = new Hono();

// Validation schema
const createRoomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().positive(),
  screen_type: z.string(),
  room_image_urls: z.array(z.string()).optional().default([]),
  layout_config: z.object({
    rows: z.number().positive(),
    columns: z.number().positive(),
  }),
  unavailable: z.array(z.string()).optional().default([]),
});

// GET /rooms - List all rooms
rooms.get("/", async (c) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.ROOMS,
        FilterExpression: "sk = :metadata",
        ExpressionAttributeValues: {
          ":metadata": "METADATA",
        },
      })
    );

    return c.json({
      success: true,
      data: result.Items as Room[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return c.json({ success: false, error: "Failed to fetch rooms" }, 500);
  }
});

// GET /rooms/:id - Get room by ID
rooms.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
      })
    );

    if (!result.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }

    return c.json({
      success: true,
      data: result.Item as Room,
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return c.json({ success: false, error: "Failed to fetch room" }, 500);
  }
});

// POST /rooms - Create a new room (admin)
rooms.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createRoomSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        { success: false, error: validationResult.error.errors },
        400
      );
    }

    const data = validationResult.data;
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const room: Room = {
      room_id: roomId,
      sk: "METADATA",
      name: data.name,
      capacity: data.capacity,
      screen_type: data.screen_type,
      room_image_urls: data.room_image_urls,
      layout_config: data.layout_config,
      unavailable: data.unavailable,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.ROOMS,
        Item: room,
      })
    );

    return c.json(
      {
        success: true,
        data: room,
        message: "Room created successfully",
      },
      201
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return c.json({ success: false, error: "Failed to create room" }, 500);
  }
});

export default rooms;
