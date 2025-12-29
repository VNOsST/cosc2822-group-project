# CineCloud - Cinema Booking Platform

Group Project for COSC2822 - Cloud Developing

A comprehensive cinema management and booking platform designed to streamline the moviegoing experience for both customers and theater operators.

## Project Structure

```
├── frontend/          # TanStack Start + Vite frontend
├── backend/           # Hono API backend (Lambda-ready)
├── db/                # DynamoDB setup and seed scripts
└── docker-compose.yml # Local development infrastructure
```

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) runtime (v1.0+)
- AWS CLI (optional, for table inspection)

### 1. Start DynamoDB Local

```bash
# Start DynamoDB Local and Admin UI
docker compose up -d

# DynamoDB will be available at http://localhost:8000
# Admin UI will be available at http://localhost:8001
```

### 2. Setup Database

```bash
# Install dependencies
cd db
bun install

# Create environment file
cp .env.example .env

# Create tables
bun run setup

# Seed sample data
bun run seed
```

### 3. Start Backend API

```bash
cd backend
bun install

# Create environment file
cp .env.example .env

# Start development server
bun run dev

# API will be available at http://localhost:3001
```

### 4. Start Frontend

```bash
cd frontend
bun install

# Create environment file
cp .env.example .env

# Start development server
bun run dev

# Frontend will be available at http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/movies` | List all movies (sorted by rating) |
| GET | `/movies/:id` | Get movie details |
| GET | `/movies/:id/showtimes` | Get showtimes for a movie |
| GET | `/showtimes` | List showtimes (with filters) |
| GET | `/showtimes/:id` | Get showtime with seat map |
| POST | `/bookings` | Create a booking |
| GET | `/bookings?user_email=...` | Get user's bookings |
| DELETE | `/bookings/:email/:id` | Cancel a booking |
| GET | `/rooms` | List all rooms |
| POST | `/rooms` | Create a room (admin) |
| GET | `/ratings/movie/:id` | Get movie ratings |
| POST | `/ratings` | Submit a rating |

## Database Scripts

```bash
# Create all tables
bun run setup

# Seed sample data
bun run seed

# Delete all tables
bun run teardown

# Full reset (teardown + setup + seed)
bun run reset
```

## Technologies

- **Frontend**: TanStack Start, React 19, Tailwind CSS, Radix UI
- **Backend**: Hono (Lambda-compatible), Zod validation
- **Database**: DynamoDB (Local for dev, AWS for production)
- **Auth**: AWS Cognito
- **Deployment**: AWS Lambda, API Gateway, ECS

## License

ISC
