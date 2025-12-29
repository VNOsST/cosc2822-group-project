/**
 * DynamoDB Teardown Script
 * Deletes all tables for a clean reset
 */

import {
  DeleteTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb'
import { dynamoDBClient } from './client'
import { TABLE_NAMES } from './types'

/**
 * Checks if a DynamoDB table exists
 * @param tableName - Name of the table to check
 * @returns True if table exists, false otherwise
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoDBClient.send(
      new DescribeTableCommand({ TableName: tableName }),
    )
    return true
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

/**
 * Deletes a DynamoDB table if it exists
 * @param tableName - Name of the table to delete
 */
async function deleteTable(tableName: string): Promise<void> {
  if (!(await tableExists(tableName))) {
    console.log(`⏭️  Table "${tableName}" does not exist, skipping...`)
    return
  }

  try {
    await dynamoDBClient.send(new DeleteTableCommand({ TableName: tableName }))
    console.log(`🗑️  Deleted table "${tableName}"`)
  } catch (error) {
    console.error(`❌ Failed to delete table "${tableName}":`, error)
    throw error
  }
}

/**
 * Main execution function
 * Deletes all DynamoDB tables
 */
async function main(): Promise<void> {
  try {
    console.log('🧹 Starting DynamoDB teardown...\n')

    const tables = Object.values(TABLE_NAMES)

    for (const tableName of tables) {
      await deleteTable(tableName)
    }

    console.log('\n✨ Teardown complete!')
    console.log(`   Total tables processed: ${tables.length}`)
  } catch (error) {
    console.error('\n💥 Teardown failed:', error)
    process.exit(1)
  }
}

main()
