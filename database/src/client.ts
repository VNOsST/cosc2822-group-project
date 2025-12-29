/**
 * DynamoDB Client Configuration
 * Provides configured DynamoDB clients for database operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// Environment configuration with sensible defaults for local development
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
const REGION = process.env.DYNAMODB_REGION || 'local'
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'local'
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'local'

/**
 * Base DynamoDB client instance
 */
const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
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
