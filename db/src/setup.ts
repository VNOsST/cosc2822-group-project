/**
 * DynamoDB Table Setup Script
 * Creates all tables with appropriate indexes for CineCloud
 */

import {
  CreateTableCommand,
  DescribeTableCommand,
  type CreateTableCommandInput,
  type GlobalSecondaryIndex,
  type KeySchemaElement,
  type AttributeDefinition,
} from "@aws-sdk/client-dynamodb";
import { dynamoDBClient } from "./client";
import { TABLE_NAMES } from "./types";

// Helper to create GSI definition
function createGSI(
  indexName: string,
  hashKey: string,
  rangeKey?: string
): GlobalSecondaryIndex {
  const keySchema: KeySchemaElement[] = [
    { AttributeName: hashKey, KeyType: "HASH" },
  ];
  if (rangeKey) {
    keySchema.push({ AttributeName: rangeKey, KeyType: "RANGE" });
  }

  return {
    IndexName: indexName,
    KeySchema: keySchema,
    Projection: { ProjectionType: "ALL" },
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
}

// Table definitions
const tableDefinitions: CreateTableCommandInput[] = [
  // Users Table
  {
    TableName: TABLE_NAMES.USERS,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [createGSI("email-index", "email")],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // Movies Table
  {
    TableName: TABLE_NAMES.MOVIES,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "tmdb_id", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" },
      { AttributeName: "rating", AttributeType: "N" },
    ],
    GlobalSecondaryIndexes: [
      createGSI("tmdb_id-index", "tmdb_id"),
      createGSI("type-rating-index", "type", "rating"),
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // Rooms Table
  {
    TableName: TABLE_NAMES.ROOMS,
    KeySchema: [
      { AttributeName: "room_id", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "room_id", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // Showtimes Table
  {
    TableName: TABLE_NAMES.SHOWTIMES,
    KeySchema: [
      { AttributeName: "movie_id", KeyType: "HASH" },
      { AttributeName: "start_time", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "movie_id", AttributeType: "S" },
      { AttributeName: "start_time", AttributeType: "S" },
      { AttributeName: "room_id", AttributeType: "S" },
      { AttributeName: "showtime_id", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      createGSI("room_id-start_time-index", "room_id", "start_time"),
      createGSI("showtime_id-index", "showtime_id"),
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // Bookings Table
  {
    TableName: TABLE_NAMES.BOOKINGS,
    KeySchema: [
      { AttributeName: "user_email", KeyType: "HASH" },
      { AttributeName: "booking_id", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "user_email", AttributeType: "S" },
      { AttributeName: "booking_id", AttributeType: "S" },
      { AttributeName: "showtime_id", AttributeType: "S" },
      { AttributeName: "user_id", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      createGSI("showtime_id-index", "showtime_id"),
      createGSI("user_id-index", "user_id"),
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // MovieRatings Table
  {
    TableName: TABLE_NAMES.MOVIE_RATINGS,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "movie_id", AttributeType: "S" },
      { AttributeName: "user_id", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      createGSI("movie_id-index", "movie_id"),
      createGSI("user_id-index", "user_id"),
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },

  // Notifications Table
  {
    TableName: TABLE_NAMES.NOTIFICATIONS,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "sent_at", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [createGSI("user_id-sent_at-index", "user_id", "sent_at")],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoDBClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    return true;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ResourceNotFoundException"
    ) {
      return false;
    }
    throw error;
  }
}

async function createTable(definition: CreateTableCommandInput): Promise<void> {
  const tableName = definition.TableName!;

  if (await tableExists(tableName)) {
    console.log(`⏭️  Table "${tableName}" already exists, skipping...`);
    return;
  }

  try {
    await dynamoDBClient.send(new CreateTableCommand(definition));
    console.log(`✅ Created table "${tableName}"`);
  } catch (error) {
    console.error(`❌ Failed to create table "${tableName}":`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting DynamoDB table setup...\n");

  for (const definition of tableDefinitions) {
    await createTable(definition);
  }

  console.log("\n✨ Table setup complete!");
}

main().catch(console.error);
