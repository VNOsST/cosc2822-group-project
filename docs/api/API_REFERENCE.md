# API Reference

Complete reference for the CineCloud REST API.

## Base URL

- **Local Development**: `http://localhost:3001`
- **Production**: `https://api.cinecloud.example.com`

## Authentication

Currently using email-based identification. Future versions will use AWS Cognito.

```http
# Include user email in requests requiring authentication
Authorization: Bearer <cognito-token>  # Future implementation
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Movies

#### List All Movies

```http
GET /movies
```

**Query Parameters:**

- `sort` (optional): `rating` | `popularity` | `release_date` (default: `rating`)
- `limit` (optional): Number of results (default: 20)

**Response:**

```json
{
  "data": [
    {
      "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "title": "Inception",
      "synopsis": "A thief who steals corporate secrets...",
      "runtime": 148,
      "release_date": "2010-07-16",
      "poster_url": "https://...",
      "genres": ["Action", "Science Fiction"],
      "rating": 8.8,
      "tmdb_popularity_score": 98.5
    }
  ]
}
```

#### Get Movie Details

```http
GET /movies/:id
```

**Response:**

```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "title": "Inception",
    "synopsis": "A thief who steals corporate secrets...",
    "runtime": 148,
    "release_date": "2010-07-16",
    "poster_url": "https://...",
    "image_urls": ["https://..."],
    "genres": ["Action", "Science Fiction", "Adventure"],
    "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
    "rating": 8.8,
    "tmdb_popularity_score": 98.5,
    "created_at": "2024-11-29T12:00:00.000Z",
    "updated_at": "2024-12-28T12:00:00.000Z"
  }
}
```

#### Get Movie Showtimes

```http
GET /movies/:id/showtimes
```

**Query Parameters:**

- `date` (optional): ISO date string (default: today)

**Response:**

```json
{
  "data": [
    {
      "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "start_time": "2024-12-29T10:00:00.000Z",
      "endtime": "2024-12-29T11:28:00.000Z",
      "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
      "price": 150000,
      "occupied_seats": ["A1", "A2"]
    }
  ]
}
```

### Showtimes

#### List Showtimes

```http
GET /showtimes
```

**Query Parameters:**

- `movie_id` (optional): Filter by movie
- `room_id` (optional): Filter by room
- `date` (optional): ISO date string
- `start_time` (optional): ISO datetime string (start range)
- `end_time` (optional): ISO datetime string (end range)

**Response:**

```json
{
  "data": [
    {
      "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "start_time": "2024-12-29T10:00:00.000Z",
      "endtime": "2024-12-29T11:28:00.000Z",
      "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
      "price": 150000
    }
  ]
}
```

#### Get Showtime with Seat Map

```http
GET /showtimes/:id
```

**Response:**

```json
{
  "data": {
    "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "start_time": "2024-12-29T10:00:00.000Z",
    "endtime": "2024-12-29T11:28:00.000Z",
    "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
    "price": 150000,
    "occupied_seats": ["A1", "A2", "B3"],
    "room": {
      "name": "IMAX Hall 1",
      "capacity": 120,
      "layout_config": {
        "rows": 10,
        "columns": 12
      },
      "unavailable": ["A1", "A12", "J1", "J12"]
    }
  }
}
```

### Bookings

#### Create Booking

```http
POST /bookings
```

**Request Body:**

```json
{
  "user_email": "john.doe@example.com",
  "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
  "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
  "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  "seats": ["C5", "C6"],
  "total_amount": 300000
}
```

**Response:**

```json
{
  "data": {
    "booking_id": "a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d",
    "user_email": "john.doe@example.com",
    "status": "confirmed",
    "booking_date": "2024-12-29T12:00:00.000Z"
  }
}
```

#### Get User Bookings

```http
GET /bookings?user_email=john.doe@example.com
```

**Response:**

```json
{
  "data": [
    {
      "booking_id": "a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d",
      "user_email": "john.doe@example.com",
      "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "seats": ["C5", "C6"],
      "total_amount": 300000,
      "status": "confirmed",
      "booking_date": "2024-12-27T12:00:00.000Z"
    }
  ]
}
```

#### Cancel Booking

```http
DELETE /bookings/:email/:id
```

**Response:**

```json
{
  "message": "Booking cancelled successfully"
}
```

### Rooms

#### List All Rooms

```http
GET /rooms
```

**Response:**

```json
{
  "data": [
    {
      "room_id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
      "name": "IMAX Hall 1",
      "capacity": 120,
      "screen_type": "IMAX",
      "room_image_urls": ["https://..."],
      "layout_config": {
        "rows": 10,
        "columns": 12
      },
      "unavailable": ["A1", "A12"]
    }
  ]
}
```

#### Create Room (Admin)

```http
POST /rooms
```

**Request Body:**

```json
{
  "name": "VIP Hall 3",
  "capacity": 50,
  "screen_type": "4DX",
  "room_image_urls": ["https://..."],
  "layout_config": {
    "rows": 5,
    "columns": 10
  },
  "unavailable": []
}
```

### Ratings

#### Get Movie Ratings

```http
GET /ratings/movie/:movie_id
```

**Response:**

```json
{
  "data": [
    {
      "id": "d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a",
      "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "rating": 9,
      "review": "Mind-bending masterpiece!",
      "created_at": "2024-12-24T12:00:00.000Z"
    }
  ]
}
```

#### Submit Rating

```http
POST /ratings
```

**Request Body:**

```json
{
  "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
  "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  "rating": 9,
  "review": "Excellent movie!"
}
```

**Response:**

```json
{
  "data": {
    "id": "d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a",
    "created_at": "2024-12-29T12:00:00.000Z"
  }
}
```

## Error Codes

| Code | Description                        |
| ---- | ---------------------------------- |
| 400  | Bad Request - Invalid parameters   |
| 404  | Not Found - Resource doesn't exist |
| 409  | Conflict - Seats already booked    |
| 500  | Internal Server Error              |

## Rate Limiting

Currently no rate limiting. Future implementation will include:

- 100 requests per minute per IP
- 1000 requests per hour per user

## Examples

### Using cURL

```bash
# Get all movies
curl http://localhost:3001/movies

# Get specific movie
curl http://localhost:3001/movies/d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a

# Create booking
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "john.doe@example.com",
    "user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "showtime_id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    "movie_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "seats": ["C5", "C6"],
    "total_amount": 300000
  }'
```

### Using JavaScript/Fetch

```javascript
// Get movies
const movies = await fetch("http://localhost:3001/movies").then((res) =>
  res.json()
);

// Create booking
const booking = await fetch("http://localhost:3001/bookings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_email: "john.doe@example.com",
    user_id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    showtime_id: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    movie_id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    seats: ["C5", "C6"],
    total_amount: 300000,
  }),
}).then((res) => res.json());
```
