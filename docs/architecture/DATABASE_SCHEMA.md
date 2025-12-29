# Database Schema

Complete DynamoDB schema for CineCloud.

## Schema Design Philosophy

CineCloud uses a **NoSQL single-table design** with DynamoDB, optimized for:

-   Fast reads and writes
-   Scalability
-   Cost efficiency
-   Access patterns

## Table Naming Convention

All tables use PascalCase naming: `Users`, `Movies`, `Showtimes`, etc.

## Tables Overview

| Table         | Purpose            | Partition Key  | Sort Key   | GSIs                                        |
| ------------- | ------------------ | -------------- | ---------- | ------------------------------------------- |
| Users         | User accounts      | id (UUID)      | -          | email-index                                 |
| Movies        | Movie catalog      | id (UUID)      | -          | tmdb_id-index, type-rating-index            |
| Rooms         | Cinema rooms       | room_id (UUID) | sk         | -                                           |
| Showtimes     | Movie screenings   | movie_id       | start_time | room_id-start_time-index, showtime_id-index |
| Bookings      | Customer bookings  | user_email     | booking_id | showtime_id-index, user_id-index            |
| MovieRatings  | User ratings       | id (UUID)      | -          | movie_id-index, user_id-index               |
| Notifications | User notifications | id (UUID)      | -          | user_id-sent_at-index                       |

## Table Details

### Users

**Purpose**: Store user account information

**Primary Key**:

-   Partition Key: `id` (String, UUID)

**Attributes**:

```typescript
{
  id: string              // UUID
  name: string
  email: string
  phone: string
  role: 'admin' | 'staff' | 'customer'
  profile_image_url?: string
  created_at: string      // ISO 8601 datetime
}
```

**Global Secondary Indexes**:

-   `email-index`: Partition Key = `email`
    -   Use case: Login by email, user lookups

**Access Patterns**:

1. Get user by ID
2. Get user by email (via GSI)
3. List all users
4. Update user profile

**Example**:

```json
{
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "name": "Admin User",
    "email": "admin@cinecloud.com",
    "phone": "+84901234567",
    "role": "admin",
    "profile_image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    "created_at": "2024-11-29T12:00:00.000Z"
}
```

---

### Movies

**Purpose**: Store movie information

**Primary Key**:

-   Partition Key: `id` (String, UUID)

**Attributes**:

```typescript
{
  id: string                    // UUID
  tmdb_id: string              // External TMDB ID
  title: string
  synopsis: string
  runtime: number              // Minutes
  release_date: string         // ISO 8601 date
  poster_url: string
  image_urls: string[]
  genres: string[]
  cast: string[]
  rating: number               // Composite rating
  tmdb_popularity_score: number
  created_at: string
  updated_at: string
  type: 'MOVIE'               // For GSI
}
```

**Global Secondary Indexes**:

-   `tmdb_id-index`: Partition Key = `tmdb_id`
    -   Use case: Lookup by external TMDB ID
-   `type-rating-index`: Partition Key = `type`, Sort Key = `rating`
    -   Use case: Get top-rated movies, sort by rating

**Access Patterns**:

1. Get movie by ID
2. Get movie by TMDB ID (via GSI)
3. List movies sorted by rating (via GSI)
4. Search movies by title
5. Update movie details

**Example**:

```json
{
    "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "tmdb_id": "tt1375666",
    "title": "Inception",
    "synopsis": "A thief who steals corporate secrets...",
    "runtime": 148,
    "release_date": "2010-07-16",
    "poster_url": "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
    "image_urls": ["https://..."],
    "genres": ["Action", "Science Fiction", "Adventure"],
    "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
    "rating": 8.8,
    "tmdb_popularity_score": 98.5,
    "created_at": "2024-11-29T12:00:00.000Z",
    "updated_at": "2024-12-28T12:00:00.000Z",
    "type": "MOVIE"
}
```

---

### Rooms

**Purpose**: Store cinema room/hall information

**Primary Key**:

-   Partition Key: `room_id` (String, UUID)
-   Sort Key: `sk` (String, typically "METADATA")

**Attributes**:

```typescript
{
  room_id: string              // UUID
  sk: string                   // "METADATA" or future expansion
  name: string
  capacity: number
  screen_type: string          // "IMAX", "Standard", "4DX", etc.
  room_image_urls: string[]
  layout_config: {
    rows: number
    columns: number
  }
  unavailable: string[]        // Permanently unavailable seats
}
```

**Access Patterns**:

1. Get room by ID
2. List all rooms
3. Update room configuration

**Example**:

```json
{
    "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
    "sk": "METADATA",
    "name": "IMAX Hall 1",
    "capacity": 120,
    "screen_type": "IMAX",
    "room_image_urls": ["https://..."],
    "layout_config": {
        "rows": 10,
        "columns": 12
    },
    "unavailable": ["A1", "A12", "J1", "J12"]
}
```

---

### Showtimes

**Purpose**: Store movie screening schedules

**Primary Key**:

-   Partition Key: `movie_id` (String, UUID)
-   Sort Key: `start_time` (String, ISO 8601 datetime)

**Attributes**:

```typescript
{
  movie_id: string             // Partition key
  start_time: string           // Sort key, ISO 8601
  showtime_id: string          // UUID for direct lookup
  room_id: string
  endtime: string              // ISO 8601
  price: number                // VND
  occupied_seats: string[]     // Array of booked seat IDs
}
```

**Global Secondary Indexes**:

-   `room_id-start_time-index`: PK = `room_id`, SK = `start_time`
    -   Use case: Get showtimes for a specific room
-   `showtime_id-index`: PK = `showtime_id`
    -   Use case: Direct lookup by showtime ID

**Access Patterns**:

1. Get showtimes for a movie
2. Get showtimes for a room (via GSI)
3. Get specific showtime by ID (via GSI)
4. Update occupied seats

**Example**:

```json
{
    "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "start_time": "2024-12-29T10:00:00.000Z",
    "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
    "endtime": "2024-12-29T11:28:00.000Z",
    "price": 150000,
    "occupied_seats": ["A1", "A2", "B3"]
}
```

---

### Bookings

**Purpose**: Store customer booking information

**Primary Key**:

-   Partition Key: `user_email` (String)
-   Sort Key: `booking_id` (String, UUID)

**Attributes**:

```typescript
{
  user_email: string           // Partition key
  booking_id: string           // Sort key, UUID
  user_id: string
  showtime_id: string
  movie_id: string
  seats: string[]              // Array of seat IDs
  total_amount: number         // VND
  status: 'confirmed' | 'cancelled' | 'pending'
  booking_date: string         // ISO 8601
}
```

**Global Secondary Indexes**:

-   `showtime_id-index`: PK = `showtime_id`
    -   Use case: Get all bookings for a showtime
-   `user_id-index`: PK = `user_id`
    -   Use case: Get all bookings for a user by ID

**Access Patterns**:

1. Get bookings for a user (by email)
2. Get bookings for a showtime (via GSI)
3. Get bookings for a user (by ID via GSI)
4. Create booking
5. Cancel booking

**Example**:

```json
{
    "user_email": "john.doe@example.com",
    "booking_id": "a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d",
    "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "seats": ["C5", "C6"],
    "total_amount": 300000,
    "status": "confirmed",
    "booking_date": "2024-12-27T12:00:00.000Z"
}
```

---

### MovieRatings

**Purpose**: Store user ratings and reviews

**Primary Key**:

-   Partition Key: `id` (String, UUID)

**Attributes**:

```typescript
{
  id: string                   // UUID
  user_id: string
  movie_id: string
  rating: number               // 1-10
  review?: string
  created_at: string           // ISO 8601
}
```

**Global Secondary Indexes**:

-   `movie_id-index`: PK = `movie_id`
    -   Use case: Get all ratings for a movie
-   `user_id-index`: PK = `user_id`
    -   Use case: Get all ratings by a user

**Access Patterns**:

1. Get rating by ID
2. Get ratings for a movie (via GSI)
3. Get ratings by a user (via GSI)
4. Create rating
5. Update rating

**Example**:

```json
{
    "id": "d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a",
    "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "rating": 9,
    "review": "Mind-bending masterpiece!",
    "created_at": "2024-12-24T12:00:00.000Z"
}
```

---

### Notifications

**Purpose**: Store user notifications

**Primary Key**:

-   Partition Key: `id` (String, UUID)

**Attributes**:

```typescript
{
    id: string; // UUID
    user_id: string;
    type: "reminder_1day" |
        "reminder_1hour" |
        "showtime_update" |
        "showtime_cancelled" |
        "rating_prompt";
    message: string;
    sent_at: string; // ISO 8601
}
```

**Global Secondary Indexes**:

-   `user_id-sent_at-index`: PK = `user_id`, SK = `sent_at`
    -   Use case: Get notifications for a user, sorted by time

**Access Patterns**:

1. Get notification by ID
2. Get notifications for a user (via GSI)
3. Create notification
4. Delete old notifications

**Example**:

```json
{
    "id": "a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d",
    "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "type": "reminder_1day",
    "message": "Reminder: Your movie 'Inception' starts tomorrow at 10:00 AM!",
    "sent_at": "2024-12-28T12:00:00.000Z"
}
```

---

## Relationships

```
Users (1) ──────── (N) Bookings
Movies (1) ──────── (N) Showtimes
Movies (1) ──────── (N) MovieRatings
Rooms (1) ──────── (N) Showtimes
Showtimes (1) ──── (N) Bookings
Users (1) ──────── (N) MovieRatings
Users (1) ──────── (N) Notifications
```

## Query Patterns

### Common Queries

1. **Get user's bookings**:

    ```
    Query: Bookings
    KeyCondition: user_email = <email>
    ```

2. **Get movie showtimes**:

    ```
    Query: Showtimes
    KeyCondition: movie_id = <movie_id>
    SortKey: start_time BETWEEN <start> AND <end>
    ```

3. **Get top-rated movies**:

    ```
    Query: Movies (type-rating-index)
    KeyCondition: type = "MOVIE"
    ScanIndexForward: false (descending)
    ```

4. **Check seat availability**:
    ```
    GetItem: Showtimes
    Key: { movie_id, start_time }
    Check: occupied_seats array
    ```

## DynamoDB Best Practices Applied

1. **UUIDs for unique identifiers**: Prevents hot partitions
2. **Composite keys**: Enables efficient queries
3. **GSIs for access patterns**: Flexible querying
4. **Denormalization**: Store related data together
5. **Sparse indexes**: Only items with index attributes
6. **Atomic updates**: Use UpdateItem for concurrency

## Capacity Planning

### Development

-   **Provisioned throughput**: 5 RCU / 5 WCU per table
-   **Cost**: Minimal for testing

### Production

-   **On-demand billing**: Auto-scales with traffic
-   **Point-in-time recovery**: Enabled
-   **Backups**: Daily automated backups

## Migration Strategy

When schema changes are needed:

1. Create new GSI (if needed)
2. Backfill data
3. Update application code
4. Remove old GSI (if applicable)

**Note**: DynamoDB doesn't support schema migrations like SQL databases. Plan attribute changes carefully.
