/**
 * DynamoDB Client Configuration
 * Shared across all backend services
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isSamLocal = !!process.env.AWS_SAM_LOCAL;
const defaultLocalEndpoint = isSamLocal
  ? "http://host.docker.internal:8000"
  : "http://localhost:8000";

const endpoint = process.env.DYNAMODB_ENDPOINT || defaultLocalEndpoint;
const region = process.env.DYNAMODB_REGION || "local";

const useLocalCreds =
  endpoint.includes("localhost") || endpoint.includes("host.docker.internal") || region === "local";

const client = new DynamoDBClient({
  endpoint,
  region,
  ...(useLocalCreds
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
        },
      }
    : process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export { client as dynamoDBClient };

/**
 * DynamoDB Table Names
 * Uses environment variables for deployed environments,
 * falls back to simple names for local development
 */
const isLocalDynamo = useLocalCreds;

export const TABLE_NAMES = {
  USERS: isLocalDynamo ? "Users" : process.env.USERS_TABLE || "Users",
  MOVIES: isLocalDynamo ? "Movies" : process.env.MOVIES_TABLE || "Movies",
  ROOMS: isLocalDynamo ? "Rooms" : process.env.ROOMS_TABLE || "Rooms",
  SHOWTIMES: isLocalDynamo ? "Showtimes" : process.env.SHOWTIMES_TABLE || "Showtimes",
  BOOKINGS: isLocalDynamo ? "Bookings" : process.env.BOOKINGS_TABLE || "Bookings",
  MOVIE_RATINGS: isLocalDynamo ? "MovieRatings" : process.env.RATINGS_TABLE || "MovieRatings",
  NOTIFICATIONS: isLocalDynamo
    ? "Notifications"
    : process.env.NOTIFICATIONS_TABLE || "Notifications",
} as const;
