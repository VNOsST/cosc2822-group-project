# Quick Start Guide

Get CineCloud up and running in minutes.

## Prerequisites

Before you begin, ensure you have:

- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) runtime (v1.0+)
- Git

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/VNOsST/cosc2822-group-project.git
cd cosc2822-group-project
```

### 2. Start DynamoDB Local

```bash
# Start DynamoDB Local and Admin UI
docker-compose up -d

# Verify services are running
docker-compose ps
```

Services available:

- **DynamoDB Local**: http://localhost:8000
- **DynamoDB Admin UI**: http://localhost:8001

### 3. Setup Database

```bash
cd database

# Install dependencies
bun install

# Create tables and seed data
bun run reset
```

Expected output:

```
🚀 Starting DynamoDB table setup...
✅ Created table "Users"
✅ Created table "Movies"
...
✨ Table setup complete!
🌱 Starting database seed...
✅ Seeded Users
...
✨ Database seed complete!
```

### 4. Start Backend API

```bash
cd ../backend

# Install dependencies
bun install

# Start development server
bun run dev
```

API available at: http://localhost:3001

Test the API:

```bash
curl http://localhost:3001/movies
```

### 5. Start Frontend

```bash
cd ../frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

Frontend available at: http://localhost:5173

## Verify Installation

### Check DynamoDB Tables

Open http://localhost:8001 in your browser to see the DynamoDB Admin UI with all tables.

### Test Backend API

```bash
# Get all movies
curl http://localhost:3001/movies

# Get specific movie
curl http://localhost:3001/movies/d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a
```

### Access Frontend

Navigate to http://localhost:5173 and you should see the CineCloud homepage.

## Default Test Accounts

| Role     | Email                | Notes                      |
| -------- | -------------------- | -------------------------- |
| Admin    | admin@cinecloud.com  | Full system access         |
| Staff    | staff@cinecloud.com  | Staff operations           |
| Customer | john.doe@example.com | Regular user with bookings |

## Common Commands

```bash
# Database
cd database
bun run setup      # Create tables only
bun run seed       # Seed data only
bun run reset      # Reset everything
bun run teardown   # Delete all tables

# Backend
cd backend
bun run dev        # Development server
bun run lint       # Check code quality

# Frontend
cd frontend
bun run dev        # Development server
bun run build      # Production build
bun run lint       # Check code quality

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Mac/Linux

# Change port in docker-compose.yml if needed
```

### Database Connection Issues

```bash
# Restart DynamoDB
docker-compose restart dynamodb-local

# Reset database
cd database && bun run reset
```

### Frontend Not Loading

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .output
bun install
bun run dev
```

## Next Steps

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - Learn about the development workflow
- [API Reference](../api/API_REFERENCE.md) - Explore available endpoints
- [Branching Strategy](../development/BRANCHING_STRATEGY.md) - Understand Git workflow
- [Architecture Overview](../architecture/SYSTEM_ARCHITECTURE.md) - Learn about system design

## Need Help?

- Check the [FAQ](./FAQ.md)
- Review the [API Documentation](../api/API_REFERENCE.md)
- See [Contributing Guide](../project/CONTRIBUTING.md)
