# CineCloud - Cinema Booking Platform

Group Project for COSC2822 - Cloud Developing

A comprehensive cinema management and booking platform designed to streamline the moviegoing experience for both customers and theater operators.

## 🚀 Quick Start

New to the project? Start here:

1. **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get up and running in minutes
2. **[Local Development](./docs/guides/LOCAL_DEVELOPMENT.md)** - Detailed development setup
3. **[API Reference](./docs/api/API_REFERENCE.md)** - Complete API documentation

## 📁 Project Structure

```
cosc2822-group-project/
├── frontend/          # TanStack Start + Vite frontend
├── backend/           # Hono API backend (Lambda-ready)
├── database/          # DynamoDB setup and seed scripts
├── docs/              # Project documentation
│   ├── guides/       # Getting started guides
│   ├── api/          # API documentation
│   ├── architecture/ # System design docs
│   ├── development/  # Development guidelines
│   ├── deployment/   # Deployment guides
│   └── project/      # Project information
└── docker-compose.yml # Local development infrastructure
```

## 📚 Documentation

### For Developers

-   [Quick Start Guide](./docs/guides/QUICK_START.md)
-   [Local Development](./docs/guides/LOCAL_DEVELOPMENT.md)
-   [API Reference](./docs/api/API_REFERENCE.md)
-   [Branching Strategy](./docs/development/BRANCHING_STRATEGY.md)
-   [Commit Convention](./docs/development/COMMIT_CONVENTION.md)
-   [Contributing Guide](./docs/project/CONTRIBUTING.md)

### For Architects

-   [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
-   [Database Schema](./docs/architecture/DATABASE_SCHEMA.md)

### For DevOps

-   [Backend Deployment](./docs/deployment/BACKEND_DEPLOYMENT.md)
-   [Database Setup](./docs/deployment/DATABASE_SETUP.md)
-   [Docker Setup](./docs/deployment/DOCKER_SETUP.md)

### Project Information

-   [Project Proposal](./docs/project/PROJECT_PROPOSAL.md)
-   [Full Documentation Index](./docs/README.md)

## Quick Start

### Prerequisites

-   [Docker](https://www.docker.com/) and Docker Compose
-   [Bun](https://bun.sh/) runtime (v1.0+)
-   AWS CLI (optional, for table inspection)

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

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/movies`                  | List all movies (sorted by rating) |
| GET    | `/movies/:id`              | Get movie details                  |
| GET    | `/movies/:id/showtimes`    | Get showtimes for a movie          |
| GET    | `/showtimes`               | List showtimes (with filters)      |
| GET    | `/showtimes/:id`           | Get showtime with seat map         |
| POST   | `/bookings`                | Create a booking                   |
| GET    | `/bookings?user_email=...` | Get user's bookings                |
| DELETE | `/bookings/:email/:id`     | Cancel a booking                   |
| GET    | `/rooms`                   | List all rooms                     |
| POST   | `/rooms`                   | Create a room (admin)              |
| GET    | `/ratings/movie/:id`       | Get movie ratings                  |
| POST   | `/ratings`                 | Submit a rating                    |

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

## 🛠️ Technologies

-   **Frontend**: TanStack Start, React 19, Tailwind CSS, Radix UI
-   **Backend**: Hono (Lambda-compatible), Zod validation
-   **Database**: DynamoDB (Local for dev, AWS for production)
-   **Auth**: AWS Cognito (planned)
-   **Deployment**: AWS Lambda, API Gateway
-   **DevOps**: Docker, SAM CLI

## 📄 License

ISC

## 🤝 Contributing

See [Contributing Guide](./docs/project/CONTRIBUTING.md) for details on our code of conduct and development process.

## 👥 Team

See [Project Proposal](./docs/project/PROJECT_PROPOSAL.md) for team information.

---

For detailed documentation, visit the [docs](./docs) directory.
