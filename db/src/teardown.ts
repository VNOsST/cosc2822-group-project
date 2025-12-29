/**
 * DynamoDB Teardown Script
 * Deletes all tables for a clean reset
 */

import {
  DeleteTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoDBClient } from "./client";
import { TABLE_NAMES } from "./types";

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

async function deleteTable(tableName: string): Promise<void> {
  if (!(await tableExists(tableName))) {
    console.log(`⏭️  Table "${tableName}" does not exist, skipping...`);
    return;
  }

  try {
    await dynamoDBClient.send(
      new DeleteTableCommand({ TableName: tableName })
    );
    console.log(`🗑️  Deleted table "${tableName}"`);
  } catch (error) {
    console.error(`❌ Failed to delete table "${tableName}":`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log("🧹 Starting DynamoDB teardown...\n");

  const tables = Object.values(TABLE_NAMES);

  for (const tableName of tables) {
    await deleteTable(tableName);
  }

  console.log("\n✨ Teardown complete!");
}

main().catch(console.error);
