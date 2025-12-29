/**
 * DynamoDB Seed Script
 * Populates tables with sample data for development
 */

import { PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import {
  TABLE_NAMES,
  type User,
  type Movie,
  type Room,
  type Showtime,
  type Booking,
  type MovieRating,
  type Notification,
} from "./types";

// Helper to generate UUID
function uuid(): string {
  return crypto.randomUUID();
}

// Helper to get ISO datetime
function isoDate(daysOffset = 0, hoursOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
}

// ============================================
// Sample Data
// ============================================

const users: User[] = [
  {
    id: "user-admin-001",
    name: "Admin User",
    email: "admin@cinecloud.com",
    phone: "+84901234567",
    role: "admin",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    created_at: isoDate(-30),
  },
  {
    id: "user-staff-001",
    name: "Staff Member",
    email: "staff@cinecloud.com",
    phone: "+84901234568",
    role: "staff",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=staff",
    created_at: isoDate(-20),
  },
  {
    id: "user-customer-001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+84901234569",
    role: "customer",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    created_at: isoDate(-10),
  },
];

const movies: Movie[] = [
  {
    id: "movie-001",
    tmdb_id: "tt1375666",
    title: "Inception",
    synopsis:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    runtime: 148,
    release_date: "2010-07-16",
    poster_url: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
    image_urls: [
      "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    ],
    genres: ["Action", "Science Fiction", "Adventure"],
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    rating: 8.8,
    tmdb_popularity_score: 98.5,
    created_at: isoDate(-30),
    updated_at: isoDate(-1),
    type: "MOVIE",
  },
  {
    id: "movie-002",
    tmdb_id: "tt0468569",
    title: "The Dark Knight",
    synopsis:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    runtime: 152,
    release_date: "2008-07-18",
    poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    image_urls: [
      "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
    ],
    genres: ["Drama", "Action", "Crime", "Thriller"],
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    rating: 9.0,
    tmdb_popularity_score: 95.2,
    created_at: isoDate(-30),
    updated_at: isoDate(-1),
    type: "MOVIE",
  },
  {
    id: "movie-003",
    tmdb_id: "tt0111161",
    title: "The Shawshank Redemption",
    synopsis:
      "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    runtime: 142,
    release_date: "1994-09-23",
    poster_url: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    image_urls: [
      "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    ],
    genres: ["Drama", "Crime"],
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    rating: 9.3,
    tmdb_popularity_score: 88.7,
    created_at: isoDate(-30),
    updated_at: isoDate(-1),
    type: "MOVIE",
  },
  {
    id: "movie-004",
    tmdb_id: "tt0816692",
    title: "Interstellar",
    synopsis:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    runtime: 169,
    release_date: "2014-11-07",
    poster_url: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    image_urls: [
      "https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    ],
    genres: ["Adventure", "Drama", "Science Fiction"],
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    rating: 8.6,
    tmdb_popularity_score: 92.3,
    created_at: isoDate(-30),
    updated_at: isoDate(-1),
    type: "MOVIE",
  },
  {
    id: "movie-005",
    tmdb_id: "tt1853728",
    title: "Django Unchained",
    synopsis:
      "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
    runtime: 165,
    release_date: "2012-12-25",
    poster_url: "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
    image_urls: [
      "https://image.tmdb.org/t/p/w1280/2oZklIzUbvZXXzIFzv7Hi68d6xf.jpg",
    ],
    genres: ["Drama", "Western"],
    cast: ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio"],
    rating: 8.4,
    tmdb_popularity_score: 85.1,
    created_at: isoDate(-30),
    updated_at: isoDate(-1),
    type: "MOVIE",
  },
];

const rooms: Room[] = [
  {
    room_id: "room-001",
    sk: "METADATA",
    name: "IMAX Hall 1",
    capacity: 120,
    screen_type: "IMAX",
    room_image_urls: ["https://example.com/rooms/imax-1.jpg"],
    layout_config: { rows: 10, columns: 12 },
    unavailable: ["A1", "A12", "J1", "J12"], // Corner seats unavailable
  },
  {
    room_id: "room-002",
    sk: "METADATA",
    name: "Standard Hall 2",
    capacity: 80,
    screen_type: "Standard",
    room_image_urls: ["https://example.com/rooms/standard-2.jpg"],
    layout_config: { rows: 8, columns: 10 },
    unavailable: [],
  },
];

// Generate showtimes for the next 7 days
function generateShowtimes(): Showtime[] {
  const showtimes: Showtime[] = [];
  const times = ["10:00", "14:00", "18:00", "21:00"];

  for (let day = 0; day < 7; day++) {
    for (const movie of movies.slice(0, 3)) {
      // First 3 movies have showtimes
      for (let i = 0; i < 2; i++) {
        const room = rooms[i % rooms.length];
        const time = times[(day + i) % times.length];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + day);
        const [hours, minutes] = time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + movie.runtime);

        showtimes.push({
          movie_id: movie.id,
          start_time: startDate.toISOString(),
          showtime_id: `showtime-${movie.id}-${day}-${i}`,
          room_id: room.room_id,
          endtime: endDate.toISOString(),
          price: room.screen_type === "IMAX" ? 150000 : 100000, // VND
          occupied_seats: new Set<string>(),
        });
      }
    }
  }

  return showtimes;
}

const showtimes = generateShowtimes();

const bookings: Booking[] = [
  {
    user_email: "john.doe@example.com",
    booking_id: "booking-001",
    user_id: "user-customer-001",
    showtime_id: showtimes[0]?.showtime_id || "showtime-movie-001-0-0",
    movie_id: "movie-001",
    seats: new Set(["A2", "A3"]),
    total_amount: 300000,
    status: "confirmed",
    booking_date: isoDate(-2),
  },
  {
    user_email: "john.doe@example.com",
    booking_id: "booking-002",
    user_id: "user-customer-001",
    showtime_id: showtimes[2]?.showtime_id || "showtime-movie-002-0-0",
    movie_id: "movie-002",
    seats: new Set(["C5", "C6", "C7"]),
    total_amount: 450000,
    status: "confirmed",
    booking_date: isoDate(-1),
  },
  {
    user_email: "john.doe@example.com",
    booking_id: "booking-003",
    user_id: "user-customer-001",
    showtime_id: showtimes[4]?.showtime_id || "showtime-movie-003-0-1",
    movie_id: "movie-003",
    seats: new Set(["E8"]),
    total_amount: 100000,
    status: "pending",
    booking_date: isoDate(0),
  },
];

const ratings: MovieRating[] = [
  {
    id: "rating-001",
    user_id: "user-customer-001",
    movie_id: "movie-001",
    rating: 9,
    review: "Mind-bending masterpiece! The visuals and storyline are incredible.",
    created_at: isoDate(-5),
  },
  {
    id: "rating-002",
    user_id: "user-customer-001",
    movie_id: "movie-002",
    rating: 10,
    review: "Heath Ledger's Joker is legendary. Best superhero movie ever!",
    created_at: isoDate(-3),
  },
  {
    id: "rating-003",
    user_id: "user-staff-001",
    movie_id: "movie-003",
    rating: 10,
    review: "Timeless classic. Morgan Freeman is amazing as always.",
    created_at: isoDate(-7),
  },
];

const notifications: Notification[] = [
  {
    id: "notif-001",
    user_id: "user-customer-001",
    type: "reminder_1day",
    message: "Reminder: Your movie 'Inception' starts tomorrow at 10:00 AM!",
    sent_at: isoDate(-1),
  },
  {
    id: "notif-002",
    user_id: "user-customer-001",
    type: "rating_prompt",
    message: "How was 'The Dark Knight'? Rate it now!",
    sent_at: isoDate(-2),
  },
];

// ============================================
// Seed Functions
// ============================================

async function seedTable<T extends object>(
  tableName: string,
  items: T[]
): Promise<void> {
  console.log(`📝 Seeding ${tableName} with ${items.length} items...`);

  for (const item of items) {
    // Convert Sets to arrays for DynamoDB compatibility
    const processedItem: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      if (value instanceof Set) {
        processedItem[key] = Array.from(value);
      } else {
        processedItem[key] = value;
      }
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: processedItem,
        })
      );
    } catch (error) {
      console.error(`❌ Failed to insert item into ${tableName}:`, error);
      throw error;
    }
  }

  console.log(`✅ Seeded ${tableName}`);
}

async function main(): Promise<void> {
  console.log("🌱 Starting database seed...\n");

  await seedTable(TABLE_NAMES.USERS, users);
  await seedTable(TABLE_NAMES.MOVIES, movies);
  await seedTable(TABLE_NAMES.ROOMS, rooms);
  await seedTable(TABLE_NAMES.SHOWTIMES, showtimes);
  await seedTable(TABLE_NAMES.BOOKINGS, bookings);
  await seedTable(TABLE_NAMES.MOVIE_RATINGS, ratings);
  await seedTable(TABLE_NAMES.NOTIFICATIONS, notifications);

  console.log("\n✨ Database seed complete!");
  console.log("\n📊 Summary:");
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Movies: ${movies.length}`);
  console.log(`   - Rooms: ${rooms.length}`);
  console.log(`   - Showtimes: ${showtimes.length}`);
  console.log(`   - Bookings: ${bookings.length}`);
  console.log(`   - Ratings: ${ratings.length}`);
  console.log(`   - Notifications: ${notifications.length}`);
}

main().catch(console.error);
