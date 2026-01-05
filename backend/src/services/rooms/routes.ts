import { Hono } from "hono";
import { z } from "zod";
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { adminOnly } from "../../shared/middleware";
import type { Room } from "../../shared/types/entities";

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

const updateRoomSchema = createRoomSchema.partial();

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
      }),
    );

    return c.json({
      success: true,
      data: result.Items as Room[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[rooms]", "Error fetching rooms:", error);
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
      }),
    );

    if (!result.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }

    return c.json({
      success: true,
      data: result.Item as Room,
    });
  } catch (error) {
    console.error("[rooms]", "Error fetching room:", error);
    return c.json({ success: false, error: "Failed to fetch room" }, 500);
  }
});

// POST /rooms - Create a new room (admin)
rooms.post("/", adminOnly(), async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createRoomSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const roomId = crypto.randomUUID();

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
      }),
    );

    return c.json(
      {
        success: true,
        data: room,
        message: "Room created successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[rooms]", "Error creating room:", error);
    return c.json({ success: false, error: "Failed to create room" }, 500);
  }
});

// PUT /rooms/:id - Update a room (admin)
rooms.put("/:id", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json();
    const validationResult = updateRoomSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;

    // Check if room exists
    const existingRoom = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
      }),
    );

    if (!existingRoom.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
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
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    // Fetch updated room
    const updatedRoom = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
      }),
    );

    return c.json({
      success: true,
      data: updatedRoom.Item as Room,
      message: "Room updated successfully",
    });
  } catch (error) {
    console.error("[rooms]", "Error updating room:", error);
    return c.json({ success: false, error: "Failed to update room" }, 500);
  }
});

// DELETE /rooms/:id - Delete a room (admin)
rooms.delete("/:id", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    // Check if room exists
    const existingRoom = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
      }),
    );

    if (!existingRoom.Item) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }

    // Check if there are any showtimes for this room
    const showtimesCheck = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "room_id-start_time-index",
        KeyConditionExpression: "room_id = :roomId",
        ExpressionAttributeValues: {
          ":roomId": id,
        },
      }),
    );

    if (showtimesCheck.Items && showtimesCheck.Items.length > 0) {
      return c.json(
        {
          success: false,
          error: "Cannot delete room with existing showtimes",
        },
        409,
      );
    }

    // Delete the room
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.ROOMS,
        Key: { room_id: id, sk: "METADATA" },
      }),
    );

    return c.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("[rooms]", "Error deleting room:", error);
    return c.json({ success: false, error: "Failed to delete room" }, 500);
  }
});

export default rooms;
