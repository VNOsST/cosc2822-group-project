/**
 * CineCloud Entity Types
 * Shared TypeScript types for all backend services
 */

// User roles - must match Cognito User Pool Groups
export type UserRole = "Admins" | "Users";

// Booking status
export type BookingStatus = "confirmed" | "cancelled" | "pending";

// Notification types
export type NotificationType =
  | "reminder_1day"
  | "reminder_1hour"
  | "showtime_update"
  | "showtime_cancelled"
  | "rating_prompt";

export interface User {
  id: string;
  cognito_sub: string; // Cognito user ID (sub claim)
  name: string;
  email: string;
  phone?: string; // Optional - may not be available from Cognito
  role: UserRole;
  profile_image_url?: string;
  created_at: string;
}

export interface Movie {
  id: string;
  tmdb_id: string;
  title: string;
  synopsis: string;
  runtime: number;
  release_date: string;
  poster_url: string;
  image_urls: string[];
  genres: string[];
  cast: string[];
  rating: number;
  tmdb_popularity_score: number;
  created_at: string;
  updated_at: string;
  type: "MOVIE";
}

export interface Room {
  room_id: string;
  sk: string;
  name: string;
  capacity: number;
  screen_type: string;
  room_image_urls: string[];
  layout_config: {
    rows: number;
    columns: number;
  };
  unavailable: string[];
}

export interface Showtime {
  movie_id: string;
  start_time: string;
  showtime_id: string;
  room_id: string;
  endtime: string;
  price: number;
  occupied_seats: string[];
}

export interface Booking {
  user_email: string;
  booking_id: string;
  user_id: string;
  showtime_id: string;
  movie_id: string;
  seats: string[];
  total_amount: number;
  status: BookingStatus;
  booking_date: string;
}

export interface MovieRating {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  review?: string;
  image_keys?: string[]; // S3 keys for review images
  created_at: string;
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  sent_at: string
  read: boolean
  metadata?: {
    movie_id?: string
    showtime_id?: string
    booking_id?: string
    movie_title?: string
  }
}

// Extended types with nested entities
export interface ShowtimeWithDetails extends Showtime {
  movie: Movie;
  room: Room;
}
