# Local Development Guide

Complete guide for developing CineCloud locally.

## Development Environment Setup

### Required Tools

1. **Bun Runtime**

   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash  # macOS/Linux
   # Or download from https://bun.sh for Windows
   ```

2. **Docker & Docker Compose**

   - Download from https://www.docker.com/products/docker-desktop

3. **Git**

   - Download from https://git-scm.com/

4. **Code Editor** (Recommended: VS Code)
   - Install from https://code.visualstudio.com/

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "amazonwebservices.aws-toolkit-vscode",
    "unifiedjs.vscode-mdx"
  ]
}
```

## Project Structure

```
cosc2822-group-project/
├── frontend/          # TanStack Start + Vite frontend
│   ├── src/
│   │   ├── routes/   # File-based routing
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── backend/           # Hono API backend
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── db/       # Database utilities
│   │   └── types/    # Type definitions
│   └── package.json
├── database/          # DynamoDB management
│   ├── src/          # Setup/seed scripts
│   └── seeds/        # JSON seed data
├── docs/              # Documentation
└── docker-compose.yml # Local infrastructure
```

## Development Workflow

### 1. Start Local Services

```bash
# Start DynamoDB Local
docker-compose up -d

# Check services are healthy
docker-compose ps
```

### 2. Database Development

```bash
cd database

# Make changes to seed data
vim seeds/movies.json

# Reset database with new data
bun run reset

# Or individual commands
bun run teardown  # Delete tables
bun run setup     # Create tables
bun run seed      # Insert data
```

### 3. Backend Development

```bash
cd backend

# Start dev server with hot reload
bun run dev

# In another terminal, test endpoints
curl http://localhost:3001/movies

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix
```

#### Adding New API Endpoints

1. Create route handler in `src/routes/`:

```typescript
// src/routes/example.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
  return c.json({ message: "Hello" });
});

export default app;
```

2. Register in `src/index.ts`:

```typescript
import example from "./routes/example";

app.route("/example", example);
```

### 4. Frontend Development

```bash
cd frontend

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

#### Creating New Pages

1. Add route file in `src/routes/`:

```typescript
// src/routes/example.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/example")({
  component: ExamplePage,
});

function ExamplePage() {
  return <div>Example Page</div>;
}
```

#### Adding Components

```bash
# Using shadcn/ui
bunx shadcn@latest add button

# Component will be added to src/components/ui/
```

## Code Quality

### Linting

```bash
# Backend
cd backend
bun run lint        # Check for issues
bun run lint:fix    # Auto-fix issues

# Frontend
cd frontend
bun run lint
bun run lint:fix

# Database
cd database
bun run lint
bun run lint:fix
```

### Formatting

```bash
# Format code with Prettier
bun run format

# Check formatting
bun run format:check
```

### Type Checking

```bash
# TypeScript type checking
bun run type-check  # If available
```

## Testing

### Backend Tests

```bash
cd backend
bun test
```

### Frontend Tests

```bash
cd frontend
bun test
```

## Database Management

### Viewing Data

Access DynamoDB Admin UI: http://localhost:8001

### Modifying Seed Data

1. Edit JSON files in `database/seeds/`
2. Run `bun run reset` to apply changes

### Adding New Tables

1. Update `database/src/types.ts`:

```typescript
export interface NewEntity {
  id: string;
  // ...fields
}

export const TABLE_NAMES = {
  // ...existing
  NEW_TABLE: "NewTable",
} as const;
```

2. Add table definition in `database/src/setup.ts`
3. Create seed data in `database/seeds/new-table.json`
4. Update `database/src/seed.ts` to load new data

## Environment Variables

### Backend `.env`

```bash
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=local
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
PORT=3001
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:3001
```

### Database `.env`

```bash
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=local
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

## Debugging

### Backend Debugging

Add debug logs:

```typescript
console.log("Debug:", data);
```

Use VS Code debugger:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "bun",
  "args": ["run", "dev"]
}
```

### Frontend Debugging

Use browser DevTools:

- React DevTools extension
- Network tab for API calls
- Console for logs

## Common Tasks

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Restart
docker-compose up -d
cd database && bun run reset
```

### Update Dependencies

```bash
# Update all packages
bun update

# Update specific package
bun update <package-name>
```

### Clean Build Artifacts

```bash
# Backend
cd backend
rm -rf node_modules .output

# Frontend
cd frontend
rm -rf node_modules .output dist

# Database
cd database
rm -rf node_modules
```

## Git Workflow

See [Branching Strategy](../development/BRANCHING_STRATEGY.md) for detailed Git workflow.

Quick reference:

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit with convention
git commit -m "feat: add new feature"

# Push and create PR
git push -u origin feature/your-feature
```

## Performance Tips

1. **Use Bun's built-in features**

   - Fast package installation
   - Native TypeScript support
   - Built-in test runner

2. **Hot Reload**

   - Backend and frontend have hot reload
   - Changes reflect instantly

3. **Parallel Development**
   - Run backend and frontend simultaneously
   - Use separate terminal windows

## Troubleshooting

### Common Issues

**Port conflicts:**

```bash
# Kill process on port
npx kill-port 3001  # Backend
npx kill-port 5173  # Frontend
npx kill-port 8000  # DynamoDB
```

**Database issues:**

```bash
# Reset database
cd database
bun run reset

# Check DynamoDB is running
docker-compose ps
```

**Module not found:**

```bash
# Reinstall dependencies
rm -rf node_modules
bun install
```

## Next Steps

- [API Reference](../api/API_REFERENCE.md)
- [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [Contributing Guide](../project/CONTRIBUTING.md)
