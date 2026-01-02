import { Hono } from "hono";
import { z } from "zod";
import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import { requireAuth, adminOnly, getUser } from "../../shared/middleware";
import type { User } from "../../shared/types/entities";

const users = new Hono();

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const userPoolId = process.env.COGNITO_USER_POOL_ID;
if (!userPoolId) {
  console.warn("[users] COGNITO_USER_POOL_ID not set");
}

// Validation schemas
const updateRoleSchema = z.object({
  role: z.enum(["Admins", "Users"]),
});

// GET /users - List all users (admin only)
users.get("/", adminOnly(), async (c) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.USERS,
      }),
    );

    return c.json({
      success: true,
      data: (result.Items || []) as User[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[users]", "Error fetching users:", error);
    return c.json({ success: false, error: "Failed to fetch users" }, 500);
  }
});

// GET /users/:id - Get user by ID
users.get("/:id", requireAuth(), async (c) => {
  const { id } = c.req.param();
  const currentUser = getUser(c);

  // Users can only view their own profile unless they're admin
  if (id !== currentUser.sub && !currentUser.groups.includes("Admins")) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id },
      }),
    );

    if (!result.Item) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: result.Item as User,
    });
  } catch (error) {
    console.error("[users]", "Error fetching user:", error);
    return c.json({ success: false, error: "Failed to fetch user" }, 500);
  }
});

// PUT /users/:id/role - Change user role (admin only)
users.put("/:id/role", adminOnly(), async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json();
    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const { role } = validationResult.data;

    // Get the user from DynamoDB
    const userResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id },
      }),
    );

    if (!userResult.Item) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const user = userResult.Item as User;

    if (!userPoolId) {
      return c.json({ success: false, error: "Cognito User Pool ID not configured" }, 500);
    }

    // Get current groups from Cognito
    let currentGroups: string[] = [];
    try {
      const groupsResult = await cognitoClient.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: user.cognito_sub,
        }),
      );
      currentGroups =
        groupsResult.Groups?.map((g) => g.GroupName || "").filter(
          (name: string | undefined): name is string => !!name,
        ) || [];
    } catch (error) {
      console.error("[users]", "Error fetching user groups:", error);
      // Continue anyway - might be a new user with no groups
    }

    // Determine old role (default to Users if no group found)
    const oldRole: "Admins" | "Users" = currentGroups.includes("Admins") ? "Admins" : "Users";

    // Only update if role is actually changing
    if (oldRole !== role) {
      // Remove from old group
      if (oldRole === "Admins") {
        try {
          await cognitoClient.send(
            new AdminRemoveUserFromGroupCommand({
              UserPoolId: userPoolId,
              Username: user.cognito_sub,
              GroupName: "Admins",
            }),
          );
        } catch (error) {
          console.error("[users]", "Error removing user from Admins group:", error);
          // Continue - user might not be in the group
        }
      }

      // Add to new group
      try {
        await cognitoClient.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: user.cognito_sub,
            GroupName: role,
          }),
        );
      } catch (error) {
        console.error("[users]", "Error adding user to group:", error);
        return c.json({ success: false, error: "Failed to update Cognito group" }, 500);
      }
    }

    // Update role in DynamoDB
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id },
        UpdateExpression: "SET #role = :role",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":role": role,
        },
      }),
    );

    return c.json({
      success: true,
      data: { id, role },
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("[users]", "Error updating user role:", error);
    return c.json({ success: false, error: "Failed to update user role" }, 500);
  }
});

export default users;
