# Backend Microservices Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                    (AWS API Gateway)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Routes by path
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                            │
        ▼                                            ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Movies     │  │  Showtimes   │  │   Bookings   │  │    Rooms     │  │   Ratings    │
│   Service    │  │   Service    │  │   Service    │  │   Service    │  │   Service    │
│  (Lambda)    │  │   (Lambda)   │  │   (Lambda)   │  │   (Lambda)   │  │   (Lambda)   │
│              │  │              │  │              │  │              │  │              │
│  Port: 3002  │  │  Port: 3003  │  │  Port: 3004  │  │  Port: 3005  │  │  Port: 3006  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │                 │
       │                 │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Amazon DynamoDB                                       │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────────┤
│   Movies     │  Showtimes   │   Bookings   │    Rooms     │   MovieRatings      │
│   Table      │   Table      │   Table      │   Table      │   Table             │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────────┘
```

## Service Communication Flow

### 1. Movies Service

```
Client → API Gateway → MoviesFunction → MoviesTable
                                      ↓
                                   Response
```

**Endpoints**: `/movies/*`
**Tables**: MoviesTable (RW)

### 2. Showtimes Service

```
Client → API Gateway → ShowtimesFunction → ShowtimesTable (RW)
                                         ↓ MoviesTable (R)
                                         ↓ RoomsTable (R)
                                         ↓
                                      Response
```

**Endpoints**: `/showtimes/*`
**Tables**:

-   ShowtimesTable (Read/Write)
-   MoviesTable (Read)
-   RoomsTable (Read)

### 3. Bookings Service

```
Client → API Gateway → BookingsFunction → BookingsTable (RW)
                                        ↓ ShowtimesTable (R)
                                        ↓
                                     Response
```

**Endpoints**: `/bookings/*`
**Tables**:

-   BookingsTable (Read/Write)
-   ShowtimesTable (Read)

### 4. Rooms Service

```
Client → API Gateway → RoomsFunction → RoomsTable
                                     ↓
                                  Response
```

**Endpoints**: `/rooms/*`
**Tables**: RoomsTable (RW)

### 5. Ratings Service

```
Client → API Gateway → RatingsFunction → MovieRatingsTable (RW)
                                       ↓ MoviesTable (R)
                                       ↓
                                    Response
```

**Endpoints**: `/ratings/*`
**Tables**:

-   MovieRatingsTable (Read/Write)
-   MoviesTable (Read)

## Request Flow Example

### Booking a Movie Ticket

```
1. Client Request
   POST /bookings
   {
     "showtimeId": "abc-123",
     "userId": "user-456",
     "seats": ["A1", "A2"]
   }
   ▼

2. API Gateway
   Routes to BookingsFunction based on /bookings path
   ▼

3. BookingsFunction (Lambda)
   - Validates request
   - Checks showtime availability (reads ShowtimesTable)
   - Creates booking record (writes to BookingsTable)
   - Updates available seats (writes to ShowtimesTable)
   ▼

4. Response
   {
     "success": true,
     "bookingId": "booking-789",
     "confirmation": "CONF-XYZ"
   }
```

## Data Access Patterns

### Read-Only Cross-Service Access

Some services read data from tables owned by other services:

```
ShowtimesFunction
  ├─ ShowtimesTable (Read/Write) ✓ Owner
  ├─ MoviesTable (Read) ← Cross-service read
  └─ RoomsTable (Read) ← Cross-service read

BookingsFunction
  ├─ BookingsTable (Read/Write) ✓ Owner
  └─ ShowtimesTable (Read) ← Cross-service read

RatingsFunction
  ├─ MovieRatingsTable (Read/Write) ✓ Owner
  └─ MoviesTable (Read) ← Cross-service read
```

**Benefits**:

-   Services remain independent
-   No inter-service API calls needed
-   Low latency data access
-   Eventual consistency is acceptable

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Account                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              CloudFormation Stack                     │ │
│  │            (via AWS SAM)                              │ │
│  │                                                       │ │
│  │  ├─ API Gateway (CineCloudApi)                       │ │
│  │  │                                                    │ │
│  │  ├─ Lambda Functions                                 │ │
│  │  │  ├─ MoviesFunction                                │ │
│  │  │  ├─ ShowtimesFunction                             │ │
│  │  │  ├─ BookingsFunction                              │ │
│  │  │  ├─ RoomsFunction                                 │ │
│  │  │  └─ RatingsFunction                               │ │
│  │  │                                                    │ │
│  │  ├─ DynamoDB Tables                                  │ │
│  │  │  ├─ MoviesTable                                   │ │
│  │  │  ├─ ShowtimesTable                                │ │
│  │  │  ├─ BookingsTable                                 │ │
│  │  │  ├─ RoomsTable                                    │ │
│  │  │  └─ MovieRatingsTable                             │ │
│  │  │                                                    │ │
│  │  ├─ IAM Roles & Policies                             │ │
│  │  │  └─ Least-privilege access per function           │ │
│  │  │                                                    │ │
│  │  └─ CloudWatch Log Groups                            │ │
│  │     ├─ /aws/lambda/cinecloud-movies-{env}           │ │
│  │     ├─ /aws/lambda/cinecloud-showtimes-{env}        │ │
│  │     ├─ /aws/lambda/cinecloud-bookings-{env}         │ │
│  │     ├─ /aws/lambda/cinecloud-rooms-{env}            │ │
│  │     └─ /aws/lambda/cinecloud-ratings-{env}          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Local Development Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Developer Machine                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Bun Runtime                               │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│ │
│  │  │   Movies     │  │  Showtimes   │  │   Bookings   ││ │
│  │  │   :3002      │  │   :3003      │  │   :3004      ││ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘│ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │    Rooms     │  │   Ratings    │                  │ │
│  │  │   :3005      │  │   :3006      │                  │ │
│  │  └──────────────┘  └──────────────┘                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Docker Container - DynamoDB Local              │ │
│  │                  Port: 8000                            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     API Gateway                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  - CORS Configuration                                │ │
│  │  - Rate Limiting (optional)                          │ │
│  │  - API Keys (optional)                               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────┐
│                  Lambda Functions                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Each function has:                                  │ │
│  │  - IAM Execution Role                                │ │
│  │  - Least-privilege DynamoDB access                   │ │
│  │  - CloudWatch Logs write permission                  │ │
│  │  - VPC configuration (optional)                      │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    DynamoDB Tables                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  - Encryption at rest (AWS managed keys)             │ │
│  │  - Point-in-time recovery (optional)                 │ │
│  │  - Backup and restore                                │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Scaling Behavior

### Horizontal Scaling

Each Lambda function scales independently based on incoming requests:

```
Low Traffic:
MoviesFunction: [Instance 1]
ShowtimesFunction: [Instance 1]
BookingsFunction: [Instance 1]
RoomsFunction: [Instance 1]
RatingsFunction: [Instance 1]

High Traffic on Movies:
MoviesFunction: [Inst 1][Inst 2][Inst 3][Inst 4][Inst 5]
ShowtimesFunction: [Instance 1]
BookingsFunction: [Instance 1]
RoomsFunction: [Instance 1]
RatingsFunction: [Instance 1]

Peak Hours (All Services):
MoviesFunction: [Inst 1][Inst 2][Inst 3]
ShowtimesFunction: [Inst 1][Inst 2][Inst 3][Inst 4]
BookingsFunction: [Inst 1][Inst 2][Inst 3][Inst 4][Inst 5]
RoomsFunction: [Inst 1][Inst 2]
RatingsFunction: [Inst 1][Inst 2]
```

### DynamoDB Auto-Scaling

Tables use on-demand billing, automatically scaling read/write capacity.

## Monitoring Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CloudWatch                              │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Metrics                                             │ │
│  │  ├─ Lambda Invocations                               │ │
│  │  ├─ Lambda Duration                                  │ │
│  │  ├─ Lambda Errors                                    │ │
│  │  ├─ Lambda Throttles                                 │ │
│  │  ├─ DynamoDB Read/Write Units                        │ │
│  │  └─ API Gateway Requests                             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Logs                                                │ │
│  │  ├─ /aws/lambda/cinecloud-movies-{env}              │ │
│  │  ├─ /aws/lambda/cinecloud-showtimes-{env}           │ │
│  │  ├─ /aws/lambda/cinecloud-bookings-{env}            │ │
│  │  ├─ /aws/lambda/cinecloud-rooms-{env}               │ │
│  │  └─ /aws/lambda/cinecloud-ratings-{env}             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Alarms (Optional)                                   │ │
│  │  ├─ High Error Rate                                  │ │
│  │  ├─ High Latency                                     │ │
│  │  └─ Throttling Events                                │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer           | Technology                 |
| --------------- | -------------------------- |
| **API Gateway** | AWS API Gateway (HTTP API) |
| **Compute**     | AWS Lambda (Node.js 20.x)  |
| **Framework**   | Hono                       |
| **Database**    | Amazon DynamoDB            |
| **IaC**         | AWS SAM (CloudFormation)   |
| **Build**       | esbuild                    |
| **Language**    | TypeScript                 |
| **Runtime**     | Bun (local), Node.js (AWS) |
| **Monitoring**  | CloudWatch Logs & Metrics  |
| **Deployment**  | AWS SAM CLI                |

## Related Documentation

-   [MICROSERVICES.md](../backend/MICROSERVICES.md) - Detailed microservices documentation
-   [API Reference](./API_REFERENCE.md) - Complete API documentation
-   [Database Schema](./DATABASE_SCHEMA.md) - DynamoDB table schemas
-   [Deployment Guide](../deployment/BACKEND_DEPLOYMENT.md) - AWS deployment instructions
