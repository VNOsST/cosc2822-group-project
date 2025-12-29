# CineCloud Database

DynamoDB database management for the CineCloud cinema booking system.

## Overview

This directory contains scripts and configuration for managing DynamoDB tables, including setup, seeding, and teardown operations.

## Prerequisites

- [Bun](https://bun.sh) runtime
- DynamoDB Local or AWS DynamoDB access
- Environment variables configured (see Configuration section)

## Project Structure

```
database/
├── src/
│   ├── client.ts      # DynamoDB client configuration
│   ├── types.ts       # TypeScript type definitions and table names
│   ├── setup.ts       # Table creation script
│   ├── seed.ts        # Data seeding script
│   └── teardown.ts    # Table deletion script
├── seeds/
│   ├── users.json
│   ├── movies.json
│   ├── rooms.json
│   ├── showtimes.json
│   ├── bookings.json
│   ├── ratings.json
│   └── notifications.json
└── package.json
```

## Configuration

Create a `.env` file in the database directory (optional, defaults provided):

```bash
# DynamoDB Configuration
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=local
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

## Installation

```bash
bun install
```

## Scripts

### Setup Tables

Creates all DynamoDB tables with appropriate indexes:

```bash
bun run setup
```

This creates the following tables:

- Users
- Movies
- Rooms
- Showtimes
- Bookings
- MovieRatings
- Notifications

### Seed Data

Populates tables with sample data from JSON files:

```bash
bun run seed
```

### Teardown

Deletes all DynamoDB tables:

```bash
bun run teardown
```

### Reset Database

Complete reset (teardown + setup + seed):

```bash
bun run reset
```

### Linting and Formatting

```bash
# Run ESLint
bun run lint

# Fix ESLint issues
bun run lint:fix

# Format with Prettier
bun run format

# Check formatting
bun run format:check
```

## Database Schema

### Users Table

- **Partition Key**: `id` (UUID)
- **GSI**: `email-index`
- **Attributes**: name, email, phone, role, profile_image_url, created_at

### Movies Table

- **Partition Key**: `id` (UUID)
- **GSI**: `tmdb_id-index`, `type-rating-index`
- **Attributes**: tmdb_id, title, synopsis, runtime, release_date, poster_url, image_urls, genres, cast, rating, tmdb_popularity_score, type, created_at, updated_at

### Rooms Table

- **Partition Key**: `room_id` (UUID)
- **Sort Key**: `sk`
- **Attributes**: name, capacity, screen_type, room_image_urls, layout_config, unavailable

### Showtimes Table

- **Partition Key**: `movie_id`
- **Sort Key**: `start_time`
- **GSI**: `room_id-start_time-index`, `showtime_id-index`
- **Attributes**: showtime_id, room_id, endtime, price, occupied_seats

### Bookings Table

- **Partition Key**: `user_email`
- **Sort Key**: `booking_id`
- **GSI**: `showtime_id-index`, `user_id-index`
- **Attributes**: user_id, showtime_id, movie_id, seats, total_amount, status, booking_date

### MovieRatings Table

- **Partition Key**: `id` (UUID)
- **GSI**: `movie_id-index`, `user_id-index`
- **Attributes**: user_id, movie_id, rating, review, created_at

### Notifications Table

- **Partition Key**: `id` (UUID)
- **GSI**: `user_id-sent_at-index`
- **Attributes**: user_id, type, message, sent_at

## Seed Data Management

Seed data is stored in JSON files in the `seeds/` directory. To modify seed data:

1. Edit the appropriate JSON file in `seeds/`
2. Run `bun run reset` to apply changes

### Data Files

- `users.json` - User accounts (admin, staff, customers)
- `movies.json` - Movie catalog
- `rooms.json` - Cinema rooms/halls
- `showtimes.json` - Movie showtimes
- `bookings.json` - Customer bookings
- `ratings.json` - Movie ratings and reviews
- `notifications.json` - User notifications

## Development

### Type Definitions

All entity types are defined in `src/types.ts`. Update this file when modifying the schema.

### Adding New Tables

1. Add table definition to `tableDefinitions` array in `src/setup.ts`
2. Add table name to `TABLE_NAMES` constant in `src/types.ts`
3. Define TypeScript interface in `src/types.ts`
4. Create seed data JSON file in `seeds/`
5. Update `src/seed.ts` to load and seed the new data

## Error Handling

All scripts include comprehensive error handling and will:

- Display descriptive error messages
- Exit with status code 1 on failure
- Skip operations for non-existent resources (e.g., deleting non-existent tables)

## Best Practices

- Always run `setup` before `seed`
- Use `reset` for a clean state during development
- Keep seed data JSON files properly formatted
- Use UUIDs for all entity IDs
- Follow the existing naming conventions

## License

See root LICENSE file.
