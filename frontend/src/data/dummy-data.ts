// DUMMY_DATA: Remove this entire file when connecting to real database
// All data below is for demonstration purposes only

// ============================================
// TYPES
// ============================================

export interface Room {
  id: string
  name: string
  capacity: number
  rows: number
  seatsPerRow: number
  screenType: '2D' | '3D' | 'IMAX' | '4DX'
  isActive: boolean
}

export interface Movie {
  id: string
  title: string
  duration: number // in minutes
  genre: Array<string>
  rating: string
  releaseDate: string
  poster: string
  synopsis: string
  director: string
  cast: Array<string>
  isNowShowing: boolean
}

export interface Showtime {
  id: string
  movieId: string
  roomId: string
  startTime: string // ISO datetime
  endTime: string // ISO datetime
  price: number
  availableSeats: number
}

export interface Booking {
  id: string
  showtimeId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  seats: Array<string> // e.g., ['A1', 'A2', 'A3']
  totalPrice: number
  status: 'confirmed' | 'cancelled' | 'pending'
  createdAt: string
}

export interface Review {
  id: string
  movieId: string
  customerName: string
  rating: number // 1-5
  comment: string
  createdAt: string
  isSpam: boolean
}

// ============================================
// DUMMY DATA
// ============================================

export const rooms: Array<Room> = [
  {
    id: 'room-1',
    name: 'Cinema Hall 1',
    capacity: 120,
    rows: 10,
    seatsPerRow: 12,
    screenType: '2D',
    isActive: true,
  },
  {
    id: 'room-2',
    name: 'Cinema Hall 2',
    capacity: 80,
    rows: 8,
    seatsPerRow: 10,
    screenType: '3D',
    isActive: true,
  },
  {
    id: 'room-3',
    name: 'IMAX Theater',
    capacity: 200,
    rows: 15,
    seatsPerRow: 14,
    screenType: 'IMAX',
    isActive: true,
  },
  {
    id: 'room-4',
    name: '4DX Experience',
    capacity: 60,
    rows: 6,
    seatsPerRow: 10,
    screenType: '4DX',
    isActive: false,
  },
]

export const movies: Array<Movie> = [
  {
    id: 'movie-1',
    title: 'Dune: Part Three',
    duration: 165,
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    rating: 'PG-13',
    releaseDate: '2025-03-15',
    poster: '/posters/dune-3.jpg',
    synopsis:
      'The epic conclusion to the Dune saga as Paul Atreides leads the Fremen in a final battle.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Florence Pugh'],
    isNowShowing: true,
  },
  {
    id: 'movie-2',
    title: 'The Batman Returns',
    duration: 152,
    genre: ['Action', 'Crime', 'Drama'],
    rating: 'PG-13',
    releaseDate: '2025-02-28',
    poster: '/posters/batman-returns.jpg',
    synopsis:
      'Bruce Wayne faces a new threat as the Riddler returns with a deadly game.',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Colin Farrell'],
    isNowShowing: true,
  },
  {
    id: 'movie-3',
    title: 'Avatar: The Way of Fire',
    duration: 180,
    genre: ['Sci-Fi', 'Adventure', 'Fantasy'],
    rating: 'PG-13',
    releaseDate: '2025-04-10',
    poster: '/posters/avatar-3.jpg',
    synopsis:
      'Jake Sully and the Omaticaya face a new elemental threat on Pandora.',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    isNowShowing: false,
  },
  {
    id: 'movie-4',
    title: 'Mission: Impossible – Dead End',
    duration: 145,
    genre: ['Action', 'Thriller', 'Spy'],
    rating: 'PG-13',
    releaseDate: '2025-01-20',
    poster: '/posters/mi-dead-end.jpg',
    synopsis:
      "Ethan Hunt's most dangerous mission yet as he faces an AI-powered enemy.",
    director: 'Christopher McQuarrie',
    cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames'],
    isNowShowing: true,
  },
]

export const showtimes: Array<Showtime> = [
  {
    id: 'show-1',
    movieId: 'movie-1',
    roomId: 'room-3',
    startTime: '2025-12-25T10:00:00',
    endTime: '2025-12-25T12:45:00',
    price: 18,
    availableSeats: 180,
  },
  {
    id: 'show-2',
    movieId: 'movie-1',
    roomId: 'room-3',
    startTime: '2025-12-25T14:00:00',
    endTime: '2025-12-25T16:45:00',
    price: 18,
    availableSeats: 150,
  },
  {
    id: 'show-3',
    movieId: 'movie-2',
    roomId: 'room-1',
    startTime: '2025-12-25T11:00:00',
    endTime: '2025-12-25T13:32:00',
    price: 12,
    availableSeats: 100,
  },
  {
    id: 'show-4',
    movieId: 'movie-2',
    roomId: 'room-2',
    startTime: '2025-12-25T15:00:00',
    endTime: '2025-12-25T17:32:00',
    price: 15,
    availableSeats: 60,
  },
  {
    id: 'show-5',
    movieId: 'movie-4',
    roomId: 'room-1',
    startTime: '2025-12-25T19:00:00',
    endTime: '2025-12-25T21:25:00',
    price: 12,
    availableSeats: 80,
  },
]

export const bookings: Array<Booking> = [
  {
    id: 'booking-1',
    showtimeId: 'show-1',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '+1-555-0101',
    seats: ['E5', 'E6', 'E7'],
    totalPrice: 54,
    status: 'confirmed',
    createdAt: '2025-12-20T14:30:00',
  },
  {
    id: 'booking-2',
    showtimeId: 'show-1',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    customerPhone: '+1-555-0102',
    seats: ['D8', 'D9'],
    totalPrice: 36,
    status: 'confirmed',
    createdAt: '2025-12-21T09:15:00',
  },
  {
    id: 'booking-3',
    showtimeId: 'show-3',
    customerName: 'Michael Brown',
    customerEmail: 'mbrown@email.com',
    customerPhone: '+1-555-0103',
    seats: ['B3', 'B4', 'B5', 'B6'],
    totalPrice: 48,
    status: 'pending',
    createdAt: '2025-12-22T16:45:00',
  },
  {
    id: 'booking-4',
    showtimeId: 'show-5',
    customerName: 'Emily Davis',
    customerEmail: 'emily.d@email.com',
    customerPhone: '+1-555-0104',
    seats: ['F10', 'F11'],
    totalPrice: 24,
    status: 'cancelled',
    createdAt: '2025-12-19T11:00:00',
  },
]

export const reviews: Array<Review> = [
  {
    id: 'review-1',
    movieId: 'movie-1',
    customerName: 'Alice Walker',
    rating: 5,
    comment:
      'Absolutely stunning! Denis Villeneuve has done it again. The visuals are breathtaking.',
    createdAt: '2025-12-18T20:30:00',
    isSpam: false,
  },
  {
    id: 'review-2',
    movieId: 'movie-1',
    customerName: 'Bob Chen',
    rating: 4,
    comment: 'Great movie, but the pacing was a bit slow in the middle act.',
    createdAt: '2025-12-19T15:45:00',
    isSpam: false,
  },
  {
    id: 'review-3',
    movieId: 'movie-2',
    customerName: 'SpamBot3000',
    rating: 1,
    comment: 'BUY CHEAP TICKETS AT SCAMSITE.COM!!! BEST DEALS!!!',
    createdAt: '2025-12-20T03:00:00',
    isSpam: true,
  },
  {
    id: 'review-4',
    movieId: 'movie-2',
    customerName: 'Carol Martinez',
    rating: 5,
    comment:
      'Robert Pattinson is the best Batman. Dark, gritty, and compelling.',
    createdAt: '2025-12-21T19:20:00',
    isSpam: false,
  },
  {
    id: 'review-5',
    movieId: 'movie-4',
    customerName: 'xXFreeMoviesXx',
    rating: 5,
    comment: 'Watch all movies FREE at piratemovies.net - no virus I promise',
    createdAt: '2025-12-22T02:15:00',
    isSpam: true,
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMovieById(id: string): Movie | undefined {
  return movies.find((m) => m.id === id)
}

export function getRoomById(id: string): Room | undefined {
  return rooms.find((r) => r.id === id)
}

export function getShowtimeById(id: string): Showtime | undefined {
  return showtimes.find((s) => s.id === id)
}

export function getShowtimesByMovie(movieId: string): Array<Showtime> {
  return showtimes.filter((s) => s.movieId === movieId)
}

export function getShowtimesByRoom(roomId: string): Array<Showtime> {
  return showtimes.filter((s) => s.roomId === roomId)
}

export function getBookingsByShowtime(showtimeId: string): Array<Booking> {
  return bookings.filter((b) => b.showtimeId === showtimeId)
}

export function getReviewsByMovie(movieId: string): Array<Review> {
  return reviews.filter((r) => r.movieId === movieId)
}

export function getNonSpamReviews(): Array<Review> {
  return reviews.filter((r) => !r.isSpam)
}

export function getSpamReviews(): Array<Review> {
  return reviews.filter((r) => r.isSpam)
}

// Check for scheduling conflicts
export function hasScheduleConflict(
  roomId: string,
  startTime: string,
  endTime: string,
  excludeShowtimeId?: string,
): boolean {
  const roomShowtimes = showtimes.filter(
    (s) => s.roomId === roomId && s.id !== excludeShowtimeId,
  )

  const newStart = new Date(startTime).getTime()
  const newEnd = new Date(endTime).getTime()

  return roomShowtimes.some((s) => {
    const existingStart = new Date(s.startTime).getTime()
    const existingEnd = new Date(s.endTime).getTime()

    // Check if times overlap
    return newStart < existingEnd && newEnd > existingStart
  })
}
