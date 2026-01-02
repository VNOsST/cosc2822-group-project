/**
 * Cognito Post Confirmation Lambda Trigger
 * Registers users in DynamoDB immediately after email confirmation
 * Adds users to the 'Users' Cognito group for role-based access control
 * Runs only once per user, making it more efficient than post-authentication
 */

import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import type { PostConfirmationTriggerHandler, PostConfirmationTriggerEvent } from "aws-lambda";

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Cognito Post Confirmation Lambda Handler
 * Registers users in DynamoDB after email confirmation
 */
export const handler: PostConfirmationTriggerHandler = async (
  event: PostConfirmationTriggerEvent,
) => {
  try {
    const cognitoSub = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;
    const name =
      event.request.userAttributes.name ||
      event.request.userAttributes["custom:name"] ||
      email?.split("@")[0] ||
      "User";
    const phone = event.request.userAttributes.phone_number;

    if (!cognitoSub) {
      console.error("[post-confirmation] Missing sub claim in event");
      return event;
    }

    // Check if user already exists by email (shouldn't happen, but be safe)
    let existingUser = null;

    try {
      const scanResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.USERS,
          IndexName: "email-index",
          KeyConditionExpression: "email = :email",
          ExpressionAttributeValues: {
            ":email": email,
          },
        }),
      );

      if (scanResult.Items && scanResult.Items.length > 0) {
        existingUser = scanResult.Items[0];
      }
    } catch (error) {
      console.error("[post-confirmation] Error checking for existing user:", error);
      // Continue anyway - we'll try to create the user
    }

    // Only create if user doesn't exist
    if (!existingUser) {
      const userId = `user-${cognitoSub}`;
      const defaultRole: "Admins" | "Users" = "Users";

      const newUser = {
        id: userId,
        cognito_sub: cognitoSub,
        name,
        email: email || "",
        phone: phone || undefined,
        role: defaultRole,
        created_at: new Date().toISOString(),
      };

      try {
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.USERS,
            Item: newUser,
          }),
        );

        console.log(
          `[post-confirmation] Registered user: ${email} (${cognitoSub}) with role: ${defaultRole}`,
        );

        // Add user to 'Users' Cognito group for RBAC
        try {
          await cognitoClient.send(
            new AdminAddUserToGroupCommand({
              UserPoolId: event.userPoolId,
              Username: event.userName,
              GroupName: "Users",
            }),
          );

          console.log(`[post-confirmation] Added user ${email} to 'Users' Cognito group`);
        } catch (groupError) {
          console.error("[post-confirmation] Error adding user to Cognito group:", groupError);
          // Don't fail confirmation if group assignment fails
          // User is still registered in DynamoDB
        }
      } catch (error) {
        console.error("[post-confirmation] Error registering user:", error);
        // Don't fail confirmation if DynamoDB write fails
        // User will still be confirmed in Cognito
      }
    } else {
      console.log(`[post-confirmation] User already registered: ${email} (${cognitoSub})`);
    }

    return event;
  } catch (error) {
    console.error("[post-confirmation] Unexpected error:", error);
    // Always return event to allow confirmation to proceed
    return event;
  }
};
