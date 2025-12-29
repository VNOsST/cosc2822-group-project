/**
 * DynamoDB Seed Script
 * Populates tables with sample data for development
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { docClient } from './client'
import {
  type Booking,
  type Movie,
  type MovieRating,
  type Notification,
  type Room,
  type Showtime,
  TABLE_NAMES,
  type User,
} from './types'

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Loads and parses JSON seed data from the seeds folder
 * @param filename - Name of the JSON file (without extension)
 * @returns Parsed array of seed data
 * @throws Error if file cannot be read or parsed
 */
function loadSeedData<T>(filename: string): T[] {
  try {
    const filepath = path.join(__dirname, '..', 'seeds', `${filename}.json`)
    const data = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(data) as T[]
  } catch (error) {
    console.error(`❌ Failed to load seed data from ${filename}.json:`, error)
    throw error
  }
}

// Load all seed data from JSON files
const users = loadSeedData<User>('users')
const movies = loadSeedData<Movie>('movies')
const rooms = loadSeedData<Room>('rooms')
const showtimes = loadSeedData<Showtime>('showtimes')
const bookings = loadSeedData<Booking>('bookings')
const ratings = loadSeedData<MovieRating>('ratings')
const notifications = loadSeedData<Notification>('notifications')

// ============================================
// Seed Functions
// ============================================

/**
 * Processes an item for DynamoDB compatibility
 * Converts Sets to arrays and handles nested objects
 * @param item - The item to process
 * @returns Processed item ready for DynamoDB
 */
function processItemForDynamoDB(item: object): Record<string, unknown> {
  const processedItem: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(item)) {
    if (value instanceof Set) {
      processedItem[key] = Array.from(value)
    } else {
      processedItem[key] = value
    }
  }

  return processedItem
}

/**
 * Seeds a DynamoDB table with an array of items
 * @param tableName - Name of the DynamoDB table
 * @param items - Array of items to seed
 */
async function seedTable<T extends object>(
  tableName: string,
  items: T[],
): Promise<void> {
  if (items.length === 0) {
    console.log(`⏭️  No items to seed for ${tableName}, skipping...`)
    return
  }

  console.log(`📝 Seeding ${tableName} with ${items.length} items...`)

  try {
    for (const item of items) {
      const processedItem = processItemForDynamoDB(item)

      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: processedItem,
        }),
      )
    }

    console.log(`✅ Seeded ${tableName}`)
  } catch (error) {
    console.error(`❌ Failed to seed table ${tableName}:`, error)
    throw error
  }
}

/**
 * Main execution function
 * Seeds all tables with data from JSON files
 */
async function main(): Promise<void> {
  try {
    console.log('🌱 Starting database seed...\n')

    // Seed tables in logical order (dependencies first)
    await seedTable(TABLE_NAMES.USERS, users)
    await seedTable(TABLE_NAMES.MOVIES, movies)
    await seedTable(TABLE_NAMES.ROOMS, rooms)
    await seedTable(TABLE_NAMES.SHOWTIMES, showtimes)
    await seedTable(TABLE_NAMES.BOOKINGS, bookings)
    await seedTable(TABLE_NAMES.MOVIE_RATINGS, ratings)
    await seedTable(TABLE_NAMES.NOTIFICATIONS, notifications)

    console.log('\n✨ Database seed complete!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Movies: ${movies.length}`)
    console.log(`   - Rooms: ${rooms.length}`)
    console.log(`   - Showtimes: ${showtimes.length}`)
    console.log(`   - Bookings: ${bookings.length}`)
    console.log(`   - Ratings: ${ratings.length}`)
    console.log(`   - Notifications: ${notifications.length}`)
  } catch (error) {
    console.error('\n💥 Seeding failed:', error)
    process.exit(1)
  }
}

main()
