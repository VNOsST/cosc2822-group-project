/**
 * CineCloud Entity Types
 * Based on the DynamoDB schema for the cinema booking system
 */

// User roles - must match Cognito User Pool Groups
export type UserRole = 'Admins' | 'Users'

// Booking status
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending'

// Notification types
export type NotificationType =
  | 'reminder_1day'
  | 'reminder_1hour'
  | 'showtime_update'
  | 'showtime_cancelled'
  | 'rating_prompt'

// ============================================
// Core Entities
// ============================================

export interface User {
  id: string // UUID - Partition Key
  cognito_sub: string // Cognito user ID (sub claim)
  name: string
  email: string
  phone?: string // Optional - may not be available from Cognito
  role: UserRole
  profile_image_url?: string
  created_at: string // ISO datetime
}

export interface Movie {
  id: string // UUID - Partition Key
  tmdb_id: string // External TMDB ID
  title: string
  synopsis: string
  runtime: number // in minutes
  release_date: string // ISO date
  poster_url: string
  image_urls: string[]
  genres: string[]
  cast: string[]
  rating: number // Composite rating (local + TMDB)
  tmdb_popularity_score: number
  created_at: string
  updated_at: string
  // GSI helper attribute
  type: 'MOVIE' // For type-rating-index
}

export interface Room {
  room_id: string // UUID - Partition Key
  sk: string // Sort Key - "METADATA" or future expansion
  name: string
  capacity: number
  screen_type: string // e.g., "IMAX", "Standard", "4DX"
  room_image_urls: string[]
  layout_config: {
    rows: number
    columns: number
  }
  unavailable: string[] // Seat IDs that are permanently unavailable
}

export interface Showtime {
  movie_id: string // Partition Key
  start_time: string // Sort Key - ISO datetime
  showtime_id: string // Unique ID for direct lookup
  room_id: string
  endtime: string // ISO datetime
  price: number
  occupied_seats: Set<string> // Set of booked seat IDs
}

export interface Booking {
  user_email: string // Partition Key
  booking_id: string // Sort Key
  user_id: string
  showtime_id: string
  movie_id: string
  seats: Set<string> // Set of seat IDs
  total_amount: number
  status: BookingStatus
  booking_date: string // ISO datetime
}

export interface MovieRating {
  id: string // UUID - Partition Key
  user_id: string
  movie_id: string
  rating: number // 1-5 or 1-10
  review?: string
  created_at: string
}

export interface Notification {
  id: string // UUID - Partition Key
  user_id: string
  type: NotificationType
  message: string
  sent_at: string // ISO datetime
}

// ============================================
// DynamoDB Item Types (with DynamoDB-specific attributes)
// ============================================

export interface DynamoDBItem {
  [key: string]: unknown
}

// Table names - Defaults for local development, can be overridden by environment variables
export const TABLE_NAMES = {
  USERS: process.env.USERS_TABLE || 'Users',
  MOVIES: process.env.MOVIES_TABLE || 'Movies',
  ROOMS: process.env.ROOMS_TABLE || 'Rooms',
  SHOWTIMES: process.env.SHOWTIMES_TABLE || 'Showtimes',
  BOOKINGS: process.env.BOOKINGS_TABLE || 'Bookings',
  MOVIE_RATINGS: process.env.RATINGS_TABLE || 'MovieRatings',
  NOTIFICATIONS: process.env.NOTIFICATIONS_TABLE || 'Notifications',
} as const

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES]
