/**
 * DynamoDB Client Configuration
 * Provides configured DynamoDB clients for database operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// Environment configuration with sensible defaults for local development
// Environment configuration
const ENDPOINT = process.env.DYNAMODB_ENDPOINT
const REGION = process.env.DYNAMODB_REGION || 'local'
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

/**
 * Base DynamoDB client instance
 * Uses provided credentials/endpoint if available, otherwise falls back to default provider chain
 */
const client = new DynamoDBClient({
  ...(ENDPOINT ? { endpoint: ENDPOINT } : {}),
  region: REGION,
  ...(ACCESS_KEY_ID && SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
        },
      }
    : {}),
})

/**
 * DynamoDB Document Client with marshalling/unmarshalling options
 * Simplifies working with DynamoDB by automatically converting JavaScript types
 */
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values before sending to DynamoDB
    convertClassInstanceToMap: true, // Convert class instances to maps
  },
  unmarshallOptions: {
    wrapNumbers: false, // Return numbers as JavaScript number type
  },
})

/**
 * Export base client for low-level operations
 */
export { client as dynamoDBClient }
