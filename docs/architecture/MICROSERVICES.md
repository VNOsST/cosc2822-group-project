# Backend Microservices Architecture

## Overview

The CineCloud backend is built using a microservices architecture where each service is deployed as a separate AWS Lambda function. API Gateway routes requests to the appropriate service based on the URL path.

## Services

### 1. Movies Service (`/movies`)

- **Lambda Function**: `MoviesFunction`
- **Handler**: `src/services/movies/index.ts`
- **Port (Local)**: 3002
- **Responsibilities**:
  - Movie catalog management
  - Movie search and filtering
  - Movie details retrieval
- **DynamoDB Tables**:
  - `MoviesTable` (read/write)

### 2. Showtimes Service (`/showtimes`)

- **Lambda Function**: `ShowtimesFunction`
- **Handler**: `src/services/showtimes/index.ts`
- **Port (Local)**: 3003
- **Responsibilities**:
  - Showtime scheduling
  - Showtime availability
  - Movie-room-time associations
- **DynamoDB Tables**:
  - `ShowtimesTable` (read/write)
  - `MoviesTable` (read)
  - `RoomsTable` (read)

### 3. Bookings Service (`/bookings`)

- **Lambda Function**: `BookingsFunction`
- **Handler**: `src/services/bookings/index.ts`
- **Port (Local)**: 3004
- **Responsibilities**:
  - Ticket booking management
  - Seat reservation
  - Booking status tracking
- **DynamoDB Tables**:
  - `BookingsTable` (read/write)
  - `ShowtimesTable` (read)

### 4. Rooms Service (`/rooms`)

- **Lambda Function**: `RoomsFunction`
- **Handler**: `src/services/rooms/index.ts`
- **Port (Local)**: 3005
- **Responsibilities**:
  - Cinema room management
  - Seat layout configuration
  - Room availability
- **DynamoDB Tables**:
  - `RoomsTable` (read/write)

### 5. Ratings Service (`/ratings`)

- **Lambda Function**: `RatingsFunction`
- **Handler**: `src/services/ratings/index.ts`
- **Port (Local)**: 3006
- **Responsibilities**:
  - Movie ratings management
  - User reviews
  - Rating aggregation
- **DynamoDB Tables**:
  - `RatingsTable` (read/write)
  - `MoviesTable` (read)

## Architecture Benefits

### Scalability

- Each service scales independently based on its specific load
- High-traffic services (e.g., movies, showtimes) can scale without affecting others

### Isolation

- Service failures are contained and don't cascade
- Each service can be deployed and updated independently
- Easier to debug and troubleshoot issues

### Performance

- Smaller bundle sizes per Lambda function
- Faster cold starts
- More efficient memory usage

### Security

- Principle of least privilege - each service only has access to required DynamoDB tables
- Easier to implement service-specific security policies

### Development

- Teams can work on different services independently
- Easier to understand and maintain smaller codebases
- Clear service boundaries and responsibilities

## API Gateway Routing

API Gateway routes requests based on the path prefix:

```
GET  /movies         → MoviesFunction
POST /movies         → MoviesFunction
GET  /movies/:id     → MoviesFunction

GET  /showtimes      → ShowtimesFunction
POST /showtimes      → ShowtimesFunction

GET  /bookings       → BookingsFunction
POST /bookings       → BookingsFunction

GET  /rooms          → RoomsFunction
POST /rooms          → RoomsFunction

GET  /ratings        → RatingsFunction
POST /ratings        → RatingsFunction
```

## Service Communication

Services are designed to be independent, but some services read from tables managed by other services:

- **Showtimes** reads from Movies and Rooms tables
- **Bookings** reads from Showtimes table
- **Ratings** reads from Movies table

This read-only cross-service data access maintains service independence while allowing necessary data relationships.

## Health Checks

Each service exposes a `/health` endpoint for monitoring:

```bash
GET /movies/health    # Returns { service: "movies", status: "ok" }
GET /showtimes/health # Returns { service: "showtimes", status: "ok" }
GET /bookings/health  # Returns { service: "bookings", status: "ok" }
GET /rooms/health     # Returns { service: "rooms", status: "ok" }
GET /ratings/health   # Returns { service: "ratings", status: "ok" }
```

## Local Development

### Running Individual Services

Each service can be run independently using Bun:

```bash
# Movies service on port 3002
bun run dev:movies

# Showtimes service on port 3003
bun run dev:showtimes

# Bookings service on port 3004
bun run dev:bookings

# Rooms service on port 3005
bun run dev:rooms

# Ratings service on port 3006
bun run dev:ratings
```

### Running All Services

Use the provided script to run all services concurrently:

```bash
bun run dev
```

## Deployment

### Prerequisites

- AWS SAM CLI installed
- AWS credentials configured
- DynamoDB tables created

### Deploy All Services

```bash
# Build all services
sam build

# Deploy to AWS
sam deploy --guided
```

### Deploy Individual Service

To deploy a specific service after making changes:

```bash
# Build and deploy only the modified service
sam build MoviesFunction
sam deploy
```

## Environment Variables

Each service has access to these environment variables:

| Variable          | Description                    |
| ----------------- | ------------------------------ |
| `NODE_ENV`        | Environment (dev/staging/prod) |
| `DYNAMODB_REGION` | AWS region for DynamoDB        |
| `MOVIES_TABLE`    | Movies table name              |
| `SHOWTIMES_TABLE` | Showtimes table name           |
| `BOOKINGS_TABLE`  | Bookings table name            |
| `ROOMS_TABLE`     | Rooms table name               |
| `RATINGS_TABLE`   | Ratings table name             |

Services only have environment variables for tables they need to access.

## Monitoring and Logging

Each service logs with a service identifier for easier filtering:

```typescript
console.log("[movies]", "Processing request...");
console.error("[showtimes]", "Error occurred:", error);
```

AWS CloudWatch automatically groups logs by Lambda function, making it easy to monitor each service independently.

## Error Handling

All services implement consistent error handling:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "service": "service-name"
}
```

The `service` field helps identify which microservice encountered the error.

## CORS Configuration

All services are configured with CORS to allow cross-origin requests:

- **Allowed Origins**: `*` (configure for production)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization

## Future Enhancements

### Potential Additional Services

- **Users Service**: User management and authentication
- **Notifications Service**: Email/SMS notifications
- **Analytics Service**: Usage analytics and reporting
- **Admin Service**: Administrative operations

### Service Mesh

Consider implementing AWS App Mesh for:

- Service-to-service authentication
- Traffic management
- Observability

### API Gateway Features

- Request validation
- Rate limiting per service
- Caching for frequently accessed data
- API keys and usage plans

## Troubleshooting

### Service Not Responding

1. Check CloudWatch logs for the specific Lambda function
2. Verify API Gateway routing configuration
3. Ensure DynamoDB table permissions are correct

### Cold Start Issues

- Consider using provisioned concurrency for critical services
- Optimize bundle sizes by minimizing dependencies
- Use Lambda layers for shared dependencies

### Cross-Service Data Issues

- Verify read permissions for tables accessed by multiple services
- Check data consistency across tables
- Review GSI configurations for query patterns

## Related Documentation

- [Folder Structure](./FOLDER_STRUCTURE.md) - Code organization
- [Backend Deployment Guide](../deployment/BACKEND_DEPLOYMENT.md) - AWS deployment
- [API Reference](../api/API_REFERENCE.md) - Complete API docs
- [Database Schema](./DATABASE_SCHEMA.md) - DynamoDB schema
- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [Backend README](../../backend/README.md) - Quick start guide
