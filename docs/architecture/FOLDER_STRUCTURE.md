# Backend Folder Structure

This document explains the organization and purpose of each folder and file in the backend service.

## Overview

The backend follows a **microservices architecture** where each service is self-contained with its own handler and routes. Shared code (database client, types) is centralized for consistency.

## Clean Structure (Updated)

✅ **Removed redundant files**:

- Old service files at root: `src/movies.ts`, `src/showtimes.ts`, `src/bookings.ts`, `src/rooms.ts`, `src/ratings.ts`, `src/index.ts`
- Old routes folder: `src/routes/*`
- Old db folder: `src/db/*`
- Old types folder: `src/types/*`

✅ **New organized structure**:

- All services in `src/services/{service-name}/`
- All shared code in `src/shared/`

## Directory Structure

```
backend/
├── src/
│   ├── services/          # All microservices
│   │   ├── movies/        # Movies service
│   │   ├── showtimes/     # Showtimes service
│   │   ├── bookings/      # Bookings service
│   │   ├── rooms/         # Rooms service
│   │   └── ratings/       # Ratings service
│   └── shared/            # Shared code across services
│       ├── db/            # Database clients
│       └── types/         # TypeScript types
├── template.yaml          # AWS SAM template
├── samconfig.toml         # SAM configuration
├── package.json
├── tsconfig.json
├── MICROSERVICES.md       # Architecture docs
├── DEPLOYMENT.md          # Deployment guide
└── README.md
```

## Service Structure

Each service follows the same structure for consistency:

```
services/{service-name}/
├── index.ts              # Lambda handler & Hono app setup
└── routes.ts             # API route definitions
```

### Service Components

#### `index.ts` - Service Entry Point

- Initializes Hono application
- Configures middleware (CORS, logging, error handling)
- Sets up health check endpoint
- Mounts routes
- Exports Lambda handler

**Example:**

```typescript
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import routes from "./routes";

const app = new Hono();
app.use("*", logger());
app.get("/health", (c) => c.json({ service: "movies", status: "ok" }));
app.route("/", routes);

export const handler = handle(app);
```

#### `routes.ts` - API Routes

- Defines all HTTP endpoints for the service
- Implements business logic
- Interacts with DynamoDB
- Returns JSON responses

**Example:**

```typescript
import { Hono } from "hono";
import { docClient, TABLE_NAMES } from "../../shared/db/client";

const movies = new Hono();

movies.get("/", async (c) => {
  // Fetch all movies
});

movies.get("/:id", async (c) => {
  // Fetch single movie
});

export default movies;
```

## Services

### 1. Movies Service (`services/movies/`)

**Purpose**: Movie catalog management

**Port**: 3002 (local development)

**Endpoints**:

- `GET /` - List all movies
- `GET /:id` - Get movie details
- `GET /:id/showtimes` - Get showtimes for a movie

**Database Access**:

- MoviesTable (read/write)
- ShowtimesTable (read)

### 2. Showtimes Service (`services/showtimes/`)

**Purpose**: Showtime scheduling and availability

**Port**: 3003 (local development)

**Endpoints**:

- `GET /` - List all showtimes (with optional filters)
- `GET /:id` - Get showtime with seat map

**Database Access**:

- ShowtimesTable (read/write)
- MoviesTable (read)
- RoomsTable (read)

### 3. Bookings Service (`services/bookings/`)

**Purpose**: Ticket booking and reservation management

**Port**: 3004 (local development)

**Endpoints**:

- `GET /` - Get user's bookings
- `POST /` - Create new booking
- `GET /showtime/:showtimeId` - Get bookings for a showtime
- `DELETE /:userEmail/:bookingId` - Cancel booking

**Database Access**:

- BookingsTable (read/write)
- ShowtimesTable (read/write)

### 4. Rooms Service (`services/rooms/`)

**Purpose**: Cinema room and seat layout management

**Port**: 3005 (local development)

**Endpoints**:

- `GET /` - List all rooms
- `GET /:id` - Get room details
- `POST /` - Create new room

**Database Access**:

- RoomsTable (read/write)

### 5. Ratings Service (`services/ratings/`)

**Purpose**: Movie ratings and reviews

**Port**: 3006 (local development)

**Endpoints**:

- `GET /movie/:movieId` - Get ratings for a movie
- `GET /user/:userId` - Get user's ratings
- `POST /` - Submit new rating

**Database Access**:

- MovieRatingsTable (read/write)
- MoviesTable (read/write)

## Shared Code

### `shared/db/client.ts`

**Purpose**: DynamoDB client configuration

**Exports**:

- `docClient` - Configured DynamoDBDocumentClient
- `dynamoDBClient` - Raw DynamoDB client
- `TABLE_NAMES` - Table name constants

**Features**:

- Automatic local/production configuration
- SAM Local support
- Environment variable handling

### `shared/types/entities.ts`

**Purpose**: TypeScript type definitions

**Exports**:

- Entity interfaces: `User`, `Movie`, `Room`, `Showtime`, `Booking`, `MovieRating`, `Notification`
- Type aliases: `UserRole`, `BookingStatus`, `NotificationType`

**Usage**:

```typescript
import type { Movie, Booking } from "../../shared/types/entities";
```

## Benefits of This Structure

### 1. **Service Independence**

Each service is self-contained with its own:

- Lambda handler
- Routes
- Business logic
- Error handling

### 2. **Code Organization**

- Clear separation between services
- Easy to locate service-specific code
- Shared code prevents duplication

### 3. **Scalability**

- Services can be developed independently
- Easy to add new services
- Simple to split large services

### 4. **Maintainability**

- Changes to one service don't affect others
- Clear ownership and responsibilities
- Easier testing and debugging

### 5. **Team Collaboration**

- Different teams can work on different services
- Reduced merge conflicts
- Clear module boundaries

## Development Guidelines

### Adding a New Service

1. **Create service folder**:

   ```bash
   mkdir -p src/services/new-service
   ```

2. **Create `index.ts`**:

   - Copy template from existing service
   - Update service name and port
   - Configure routes

3. **Create `routes.ts`**:

   - Define API endpoints
   - Implement business logic
   - Use shared types and DB client

4. **Update `template.yaml`**:

   - Add Lambda function resource
   - Configure API Gateway routes
   - Set DynamoDB permissions

5. **Update `package.json`**:
   - Add dev script for local development
   - Include in `dev:all` script

### Modifying a Service

1. **Locate service folder**: `src/services/{service-name}/`
2. **Edit files**:
   - `index.ts` for middleware/config changes
   - `routes.ts` for endpoint changes
3. **Test locally**: `bun run dev:{service-name}`
4. **Deploy**: `sam build && sam deploy`

### Sharing Code

**When to add to `shared/`**:

- Code used by 2+ services
- Database utilities
- Common types
- Validation schemas
- Helper functions

**When NOT to share**:

- Service-specific business logic
- Single-use utilities
- Service-specific types

## File Naming Conventions

- **Service files**: `index.ts`, `routes.ts`
- **Shared files**: Descriptive names (`client.ts`, `entities.ts`)
- **Folders**: Lowercase, hyphenated (`my-service`)
- **Types files**: `.ts` extension, not `.d.ts`

## Import Paths

### From Service to Shared

```typescript
import { docClient } from "../../shared/db/client";
import type { Movie } from "../../shared/types/entities";
```

### Within Service

```typescript
import routes from "./routes";
```

## Best Practices

1. **Keep services focused**: Each service should have a single responsibility
2. **Use shared types**: Always import from `shared/types/entities`
3. **Consistent error handling**: Follow the pattern in `index.ts`
4. **Log with service name**: Use `console.log('[service-name]', ...)`
5. **Export Lambda handler**: Always export `handler` from `index.ts`
6. **Health checks**: Every service should have `/health` endpoint

## Troubleshooting

### Import Errors

- Check path is correct relative to file
- Verify file exists in `shared/` folder
- Ensure TypeScript compiles without errors

### Service Won't Start

- Check port isn't already in use
- Verify `index.ts` exports handler
- Ensure all dependencies are installed

### Lambda Build Fails

- Check `template.yaml` entry points
- Verify file paths are correct
- Run `sam build` to see detailed errors

## Related Documentation

- [Microservices Architecture](./MICROSERVICES.md) - Architecture overview
- [Backend README](../../backend/README.md) - Backend documentation
- [API Reference](../api/API_REFERENCE.md) - API documentation
