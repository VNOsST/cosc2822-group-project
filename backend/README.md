# CineCloud Backend

Backend API services for the CineCloud cinema management system, built with a microservices architecture using AWS Lambda and API Gateway.

## Architecture

This backend uses a **microservices architecture** where each service runs as an independent AWS Lambda function. See [Microservices Architecture](../docs/architecture/MICROSERVICES.md) for detailed documentation, [Folder Structure](../docs/architecture/FOLDER_STRUCTURE.md) for organization details, and [API Endpoints](./API_ENDPOINTS.md) for complete API reference.

### Services

-   **Movies Service** (`/movies`) - Movie catalog management with CRUD operations, search, and filtering
-   **Showtimes Service** (`/showtimes`) - Showtime scheduling with seat map generation and conflict detection
-   **Bookings Service** (`/bookings`) - Ticket reservations with seat validation and statistics
-   **Rooms Service** (`/rooms`) - Cinema room management with layout configuration
-   **Ratings Service** (`/ratings`) - Movie ratings and reviews with automatic average calculation

## Tech Stack

-   **Runtime**: Node.js 20.x (AWS Lambda)
-   **Framework**: Hono - Fast, lightweight web framework
-   **Database**: Amazon DynamoDB
-   **Infrastructure**: AWS SAM (Serverless Application Model)
-   **Build Tool**: esbuild via SAM
-   **Language**: TypeScript

## Project Structure

```
backend/
├── src/
│   ├── services/               # Microservices - each service is self-contained
│   │   ├── movies/
│   │   │   ├── index.ts        # Movies service entry point & Lambda handler
│   │   │   └── routes.ts       # Movies API routes
│   │   ├── showtimes/
│   │   │   ├── index.ts        # Showtimes service entry point & Lambda handler
│   │   │   └── routes.ts       # Showtimes API routes
│   │   ├── bookings/
│   │   │   ├── index.ts        # Bookings service entry point & Lambda handler
│   │   │   └── routes.ts       # Bookings API routes
│   │   ├── rooms/
│   │   │   ├── index.ts        # Rooms service entry point & Lambda handler
│   │   │   └── routes.ts       # Rooms API routes
│   │   └── ratings/
│   │       ├── index.ts        # Ratings service entry point & Lambda handler
│   │       └── routes.ts       # Ratings API routes
│   └── shared/                 # Shared code across all services
│       ├── db/
│       │   └── client.ts       # DynamoDB client configuration
│       └── types/
│           └── entities.ts     # TypeScript entity types
├── template.yaml               # SAM infrastructure template
├── samconfig.toml              # SAM configuration
├── package.json
├── tsconfig.json
├── MICROSERVICES.md            # Architecture documentation
└── DEPLOYMENT.md               # Deployment guide
```

## Quick Start

### Prerequisites

-   [Bun](https://bun.sh) installed for local development
-   [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
-   AWS credentials configured
-   DynamoDB tables set up (see [Database Setup](../docs/deployment/DATABASE_SETUP.md))

### Installation

```bash
cd backend
bun install
```

### Local Development

#### Run All Services

```bash
bun run dev
```

This starts all microservices:

-   Movies: http://localhost:3002
-   Showtimes: http://localhost:3003
-   Bookings: http://localhost:3004
-   Rooms: http://localhost:3005
-   Ratings: http://localhost:3006

#### Run Individual Service

```bash
# Movies service
bun run dev:movies

# Showtimes service
bun run dev:showtimes

# Bookings service
bun run dev:bookings

# Rooms service
bun run dev:rooms

# Ratings service
bun run dev:ratings
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
DYNAMODB_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000

# Table names (should match your database setup)
MOVIES_TABLE=cinecloud-movies-dev
SHOWTIMES_TABLE=cinecloud-showtimes-dev
BOOKINGS_TABLE=cinecloud-bookings-dev
ROOMS_TABLE=cinecloud-rooms-dev
RATINGS_TABLE=cinecloud-ratings-dev
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

```bash
# Build all services
sam build

# Deploy to AWS
sam deploy --guided
```

## API Documentation

Full API reference available at [docs/api/API_REFERENCE.md](../docs/api/API_REFERENCE.md).

### Example Endpoints

#### Movies

```bash
GET    /movies              # List all movies
GET    /movies/:id          # Get movie details
POST   /movies              # Create movie (admin)
PUT    /movies/:id          # Update movie (admin)
DELETE /movies/:id          # Delete movie (admin)
```

#### Showtimes

```bash
GET    /showtimes           # List showtimes
GET    /showtimes/:id       # Get showtime details
POST   /showtimes           # Create showtime (admin)
```

#### Bookings

```bash
GET    /bookings            # List user's bookings
POST   /bookings            # Create booking
GET    /bookings/:id        # Get booking details
DELETE /bookings/:id        # Cancel booking
```

#### Rooms

```bash
GET    /rooms               # List all rooms
GET    /rooms/:id           # Get room details
POST   /rooms               # Create room (admin)
```

#### Ratings

```bash
GET    /ratings/movie/:id   # Get ratings for a movie
POST   /ratings             # Submit rating
PUT    /ratings/:id         # Update rating
DELETE /ratings/:id         # Delete rating
```

## Health Checks

Each service exposes a health endpoint:

```bash
GET /movies/health
GET /showtimes/health
GET /bookings/health
GET /rooms/health
GET /ratings/health
```

Response:

```json
{
    "service": "movies",
    "status": "ok"
}
```

## Testing

```bash
# Run all tests
bun test

# Run tests for specific service
bun test src/__tests__/movies.test.ts

# Watch mode
bun test --watch
```

## Code Quality

### Linting

```bash
# Run ESLint
bun run lint

# Fix auto-fixable issues
bun run lint:fix
```

### Formatting

```bash
# Check formatting
bun run format:check

# Fix formatting
bun run format
```

### Type Checking

```bash
# Run TypeScript compiler
bun run type-check
```

## Monitoring

### CloudWatch Logs

Each Lambda function logs to its own CloudWatch Log Group:

-   `/aws/lambda/cinecloud-movies-{env}`
-   `/aws/lambda/cinecloud-showtimes-{env}`
-   `/aws/lambda/cinecloud-bookings-{env}`
-   `/aws/lambda/cinecloud-rooms-{env}`
-   `/aws/lambda/cinecloud-ratings-{env}`

### Metrics

Monitor these CloudWatch metrics:

-   **Invocations**: Number of times each function is called
-   **Duration**: Execution time
-   **Errors**: Function errors
-   **Throttles**: Throttled requests
-   **ConcurrentExecutions**: Number of concurrent executions

## Troubleshooting

### Common Issues

#### Service Not Responding

1. Check CloudWatch logs for the specific service
2. Verify API Gateway routing
3. Check DynamoDB table permissions

#### DynamoDB Connection Issues

1. Verify AWS credentials
2. Check DYNAMODB_ENDPOINT for local development
3. Ensure tables exist and match environment variable names

#### Cold Starts

-   First request to a Lambda function may be slower
-   Consider provisioned concurrency for critical services
-   Monitor metrics to identify problematic services

## Contributing

See [CONTRIBUTING.md](../docs/project/CONTRIBUTING.md) for contribution guidelines.

## Related Documentation

-   [Folder Structure](../docs/architecture/FOLDER_STRUCTURE.md) - Detailed folder organization guide
-   [Microservices Architecture](../docs/architecture/MICROSERVICES.md) - Architecture overview
-   [Deployment Guide](../docs/deployment/BACKEND_DEPLOYMENT.md) - AWS deployment instructions
-   [API Reference](../docs/api/API_REFERENCE.md) - Complete API documentation
-   [Database Schema](../docs/architecture/DATABASE_SCHEMA.md) - DynamoDB schema
-   [System Architecture](../docs/architecture/SYSTEM_ARCHITECTURE.md) - Overall system design

## License

See [LICENSE](../LICENSE) file in the root directory.
