/**
 * Admin Notification Event Types
 *
 * These types define the structure of events that trigger admin notifications via SNS.
 */

// Event type identifiers
export type AdminEventType =
  | "booking_cancelled"
  | "booking_created"
  | "user_registered"
  | "low_seat_availability"
  | "test_notification";

// Base event interface
interface BaseAdminEvent {
  type: AdminEventType;
  timestamp: string;
}

// Booking cancelled event
export interface BookingCancelledEvent extends BaseAdminEvent {
  type: "booking_cancelled";
  bookingId: string;
  userEmail: string;
  movieTitle: string;
  showtime: string;
  roomName: string;
  seats: Array<string>;
  refundAmount: number;
}

// Booking created event
export interface BookingCreatedEvent extends BaseAdminEvent {
  type: "booking_created";
  bookingId: string;
  userEmail: string;
  movieTitle: string;
  showtime: string;
  roomName: string;
  seats: Array<string>;
  totalAmount: number;
}

// User registered event
export interface UserRegisteredEvent extends BaseAdminEvent {
  type: "user_registered";
  userId: string;
  userEmail: string;
  userName: string;
}

// Low seat availability event
export interface LowSeatAvailabilityEvent extends BaseAdminEvent {
  type: "low_seat_availability";
  showtimeId: string;
  movieTitle: string;
  showtime: string;
  roomName: string;
  remainingSeats: number;
  totalCapacity: number;
  percentageFilled: number;
}

// Test notification event
export interface TestNotificationEvent extends BaseAdminEvent {
  type: "test_notification";
  message: string;
  triggeredBy: string;
}

// Union type for all admin events
export type AdminEvent =
  | BookingCancelledEvent
  | BookingCreatedEvent
  | UserRegisteredEvent
  | LowSeatAvailabilityEvent
  | TestNotificationEvent;

// Configuration constants
export const LOW_SEAT_THRESHOLD_PERCENT = 80;
