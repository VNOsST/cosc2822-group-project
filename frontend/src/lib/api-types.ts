/**
 * API Type Definitions
 * Matches backend entity types from src/shared/types/entities.ts
 */

// Re-export backend entity types for frontend use
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending'
export type UserRole = 'Admins' | 'Users'

export interface User {
  id: string
  cognito_sub: string
  name: string
  email: string
  phone?: string
  role: UserRole
  profile_image_url?: string
  created_at: string
}

export interface Movie {
  id: string
  tmdb_id: string
  title: string
  synopsis: string
  runtime: number
  release_date: string
  poster_url: string
  image_urls: Array<string>
  genres: Array<string>
  cast: Array<string>
  rating: number
  tmdb_popularity_score: number
  created_at: string
  updated_at: string
}

export interface Room {
  room_id: string
  name: string
  capacity: number
  screen_type: string
  room_image_urls: Array<string>
  layout_config: {
    rows: number
    columns: number
  }
  unavailable: Array<string>
}

export interface Showtime {
  movie_id: string
  start_time: string
  showtime_id: string
  room_id: string
  endtime: string
  price: number
  occupied_seats: Array<string>
}

export interface ShowtimeWithDetails extends Showtime {
  movie: Movie
  room: Room
}

export interface Booking {
  user_email: string
  booking_id: string
  user_id: string
  showtime_id: string
  movie_id: string
  seats: Array<string>
  total_amount: number
  status: BookingStatus
  booking_date: string
}

export interface BookingWithDetails extends Booking {
  user?: User
  showtime?: Showtime
  movie?: Movie
  room?: Room
}

export interface MovieRating {
  id: string
  user_id: string
  movie_id: string
  rating: number
  review?: string
  created_at: string
  is_spam?: boolean
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  message?: string
}
