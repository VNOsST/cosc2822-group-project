# System Architecture

CineCloud system architecture and design overview.

## High-Level Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────┐
│   Frontend (TanStack)   │
│   - React 19            │
│   - Tailwind CSS        │
│   - Radix UI            │
└──────────┬──────────────┘
           │
           │ REST API
           ▼
┌─────────────────────────┐
│   API Gateway (AWS)     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   Backend (Lambda)      │
│   - Hono Framework      │
│   - Node.js 20.x        │
└──────────┬──────────────┘
           │
           ├──────────────┐
           │              │
           ▼              ▼
  ┌────────────┐   ┌────────────┐
  │  DynamoDB  │   │  Cognito   │
  │  Tables    │   │  Auth      │
  └────────────┘   └────────────┘
```

## Components

### Frontend Layer

**Technology**: TanStack Start + React 19

**Responsibilities**:

-   User interface rendering
-   Client-side routing
-   Form validation
-   State management
-   API communication

**Key Features**:

-   File-based routing
-   Server-side rendering (SSR)
-   Static generation
-   Type-safe API calls

**Structure**:

```
frontend/
├── src/
│   ├── routes/          # File-based routing
│   │   ├── __root.tsx   # Root layout
│   │   ├── index.tsx    # Home page
│   │   ├── login.tsx    # Auth page
│   │   ├── admin/       # Admin routes
│   │   ├── user/        # User routes
│   │   └── public/      # Public routes
│   ├── components/      # React components
│   │   ├── ui/          # Shadcn components
│   │   └── ...          # Custom components
│   ├── lib/             # Utilities
│   │   ├── auth-context.tsx
│   │   └── utils.ts
│   └── hooks/           # Custom hooks
└── ...
```

### Backend Layer

**Technology**: Hono + AWS Lambda

**Responsibilities**:

-   API endpoint handling
-   Business logic
-   Data validation
-   Database operations
-   Authentication/Authorization

**Key Features**:

-   Lambda-compatible
-   Middleware support
-   Type-safe routing
-   Zod validation

**Structure**:

```
backend/
├── src/
│   ├── index.ts         # Entry point
│   ├── routes/          # API routes
│   │   ├── movies.ts    # Movie endpoints
│   │   ├── showtimes.ts # Showtime endpoints
│   │   ├── bookings.ts  # Booking endpoints
│   │   ├── rooms.ts     # Room endpoints
│   │   └── ratings.ts   # Rating endpoints
│   ├── db/              # Database client
│   │   └── client.ts
│   └── types/           # TypeScript types
│       └── entities.ts
└── ...
```

### Database Layer

**Technology**: AWS DynamoDB

**Characteristics**:

-   NoSQL document database
-   Serverless
-   Auto-scaling
-   Single-table design patterns
-   Global secondary indexes (GSI)

**Key Tables**:

-   Users
-   Movies
-   Rooms
-   Showtimes
-   Bookings
-   MovieRatings
-   Notifications

See [Database Schema](./DATABASE_SCHEMA.md) for details.

### Authentication Layer

**Technology**: AWS Cognito (Future Implementation)

**Features**:

-   User registration
-   Login/logout
-   JWT tokens
-   MFA support
-   Social login integration

## Data Flow

### Movie Browsing Flow

```
User → Frontend → API Gateway → Lambda → DynamoDB
                                         │
                                         ▼
                                    Movies Table
                                         │
                                         ▼
Lambda ← API Gateway ← Frontend ← Response
```

### Booking Creation Flow

```
User Selects Seats
    ↓
Frontend Validation
    ↓
POST /bookings
    ↓
API Gateway
    ↓
Lambda Function
    ├─→ Validate User
    ├─→ Check Seat Availability
    ├─→ Create Booking
    └─→ Update Showtime
        ↓
    DynamoDB
    ├─→ Bookings Table
    └─→ Showtimes Table
        ↓
    Return Confirmation
```

## Deployment Architecture

### Development Environment

```
┌─────────────┐
│ Developer   │
└──────┬──────┘
       │
       ├─→ Frontend (localhost:5173)
       │   └─→ Vite Dev Server
       │
       ├─→ Backend (localhost:3001)
       │   └─→ Bun Runtime
       │
       └─→ Database (localhost:8000)
           └─→ DynamoDB Local (Docker)
```

### Production Environment

```
┌──────────┐
│  Users   │
└────┬─────┘
     │
     ▼
┌────────────────┐
│  CloudFront    │ (CDN)
└────┬───────────┘
     │
     ├─→ Frontend (S3)
     │   └─→ Static Assets
     │
     └─→ API Gateway
         └─→ Lambda Functions
             ├─→ DynamoDB
             ├─→ Cognito
             └─→ CloudWatch
```

## Scalability

### Horizontal Scaling

-   **Lambda**: Auto-scales based on requests
-   **DynamoDB**: On-demand capacity mode
-   **CloudFront**: Global CDN distribution
-   **API Gateway**: Automatic scaling

### Performance Optimizations

1. **Caching**:

    - CloudFront for static assets
    - API response caching
    - DynamoDB DAX (optional)

2. **Database**:

    - Optimized indexes
    - Efficient query patterns
    - Batch operations

3. **Frontend**:
    - Code splitting
    - Lazy loading
    - Image optimization

## Security Architecture

### Layers of Security

1. **Network Layer**:

    - HTTPS/TLS encryption
    - WAF rules
    - DDoS protection

2. **Authentication**:

    - Cognito user pools
    - JWT tokens
    - MFA support

3. **Authorization**:

    - Role-based access control (RBAC)
    - IAM policies
    - API key validation

4. **Data Layer**:
    - Encryption at rest
    - Encryption in transit
    - Backup and recovery

### Security Flow

```
User Request
    ↓
CloudFront (SSL/TLS)
    ↓
WAF Rules
    ↓
API Gateway
    ↓
Cognito Authorizer
    ↓
Lambda (IAM Role)
    ↓
DynamoDB (Encrypted)
```

## Monitoring & Logging

### CloudWatch Integration

-   **Metrics**:

    -   API request count
    -   Lambda duration
    -   Error rates
    -   DynamoDB throughput

-   **Logs**:

    -   Application logs
    -   Access logs
    -   Error logs

-   **Alarms**:
    -   High error rate
    -   Slow response time
    -   Cost thresholds

### Logging Strategy

```javascript
// Structured logging
logger.info("Booking created", {
    bookingId,
    userId,
    showtimeId,
    seats: seatCount,
});
```

## Cost Optimization

### Serverless Benefits

-   Pay only for what you use
-   No idle server costs
-   Auto-scaling reduces over-provisioning

### Cost Breakdown

| Service     | Pricing Model           |
| ----------- | ----------------------- |
| Lambda      | Per request + duration  |
| DynamoDB    | On-demand pricing       |
| API Gateway | Per request             |
| S3          | Storage + data transfer |
| CloudFront  | Data transfer           |

### Optimization Strategies

1. Use on-demand DynamoDB pricing
2. Optimize Lambda memory allocation
3. Enable CloudFront caching
4. Compress static assets
5. Monitor and set budgets

## Technology Stack Summary

| Layer      | Technology               | Purpose             |
| ---------- | ------------------------ | ------------------- |
| Frontend   | TanStack Start, React 19 | User interface      |
| Styling    | Tailwind CSS, Radix UI   | Component styling   |
| Backend    | Hono, Lambda             | API handling        |
| Database   | DynamoDB                 | Data storage        |
| Auth       | Cognito                  | User authentication |
| CDN        | CloudFront               | Content delivery    |
| Monitoring | CloudWatch               | Observability       |
| IaC        | SAM                      | Infrastructure      |

## Design Principles

1. **Serverless-First**: Minimize operational overhead
2. **Type Safety**: TypeScript across the stack
3. **API-Driven**: Clear separation of concerns
4. **Scalable**: Designed for growth
5. **Secure**: Security built-in from the start
6. **Cost-Effective**: Pay only for usage

## Future Enhancements

-   [ ] GraphQL API option
-   [ ] Real-time notifications (WebSocket)
-   [ ] Mobile app (React Native)
-   [ ] Payment integration
-   [ ] Analytics dashboard
-   [ ] Content recommendation engine
-   [ ] Multi-region deployment
