# AGENTS.md - CineCloud Development Guide for AI Agents

This document provides essential information for AI coding agents working on the CineCloud project.

## Project Overview

CineCloud is a cinema booking platform with a microservices architecture:

- **Frontend**: TanStack Start + React 19 + Tailwind CSS
- **Backend**: Hono API (Lambda-compatible) with multiple services
- **Database**: DynamoDB (Local for dev, AWS for production)
- **Runtime**: Bun (v1.0+)

## Project Structure

```
cosc2822-group-project/
├── frontend/          # TanStack Start frontend application
├── backend/           # Hono microservices (movies, showtimes, bookings, rooms, ratings)
├── database/          # DynamoDB setup and seed scripts
└── docs/              # Project documentation
```

## Build, Lint & Test Commands

### Root Level

```bash
bun format          # Format all code (runs in frontend)
bun format:check    # Check formatting (runs in frontend)
bun lint            # Lint all code (runs in frontend)
```

### Frontend (frontend/)

```bash
bun dev             # Start dev server (port 5173)
bun build           # Build production bundle
bun start           # Start production server
bun preview         # Preview production build
bun test            # Run tests with Vitest
bun lint            # Run oxlint
bun format          # Format with oxfmt
bun format:check    # Check formatting
bun check           # Format and lint (auto-fix)
```

### Backend (backend/)

```bash
bun dev             # Start all services concurrently
bun dev:movies      # Start movies service (port 3002)
bun dev:showtimes   # Start showtimes service
bun dev:bookings    # Start bookings service
bun dev:rooms       # Start rooms service
bun dev:ratings     # Start ratings service
bun build:lambda    # Build for AWS Lambda (SAM)
bun deploy          # Deploy to AWS
```

### Database (database/)

```bash
bun setup           # Create all DynamoDB tables
bun seed            # Seed sample data
bun teardown        # Delete all tables
bun reset           # Full reset (teardown + setup + seed)
bun lint            # Lint database scripts
bun lint:fix        # Auto-fix lint issues
bun format          # Format with Prettier
bun format:check    # Check formatting
```

### Testing

```bash
# Run all tests
cd frontend && bun test

# Run tests in watch mode
cd frontend && bun test --watch

# Run single test file
cd frontend && bun test path/to/test.test.tsx

# Run tests with coverage
cd frontend && bun test --coverage
```

## Code Style Guidelines

### Imports

**Sort Order** (enforced by eslint/oxlint):

1. External packages (React, third-party libraries)
2. Internal absolute imports (@/\* paths)
3. Relative imports (../, ./)
4. Type-only imports should use `import type`

```typescript
// Frontend example
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Backend example
import { Hono } from "hono";
import { z } from "zod";
import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { docClient, TABLE_NAMES } from "../../shared/db/client";
import type { Movie, Showtime } from "../../shared/types/entities";
```

### Formatting

**Frontend (oxfmt + Prettier)**:

- No semicolons
- Single quotes
- Trailing commas (all)
- 2 spaces indentation
- Max line width: 80 (database), default (frontend)

**Backend**: Follow TypeScript ESNext conventions

**Database**: Prettier with consistent config

### TypeScript

**Strict Mode**: Enabled in all projects

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Type Preferences**:

- Use `type` for object shapes and unions
- Use `interface` for extendable contracts
- Prefer `Array<T>` over `T[]` (enforced by oxlint)
- Use `type` imports: `import type { ... }`
- Avoid `any` (warn level in database, error in frontend via oxlint)

```typescript
// Good
import type { Movie } from "@/types";
const movies: Array<Movie> = [];

// Avoid
import { Movie } from "@/types";
const movies: Movie[] = [];
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`, `booking-service.ts`)
- **Components**: PascalCase (`Button`, `UserProfile`)
- **Functions/Variables**: camelCase (`fetchMovies`, `userData`)
- **Constants**: UPPER_SNAKE_CASE (`TABLE_NAMES`, `API_URL`)
- **Types/Interfaces**: PascalCase (`Movie`, `BookingRequest`)
- **Private/Unused**: Prefix with `_` to avoid warnings

### Error Handling

**Backend Pattern** (Hono):

```typescript
try {
  const result = await docClient.send(new GetCommand({ ... }))

  if (!result.Item) {
    return c.json({ success: false, error: 'Not found' }, 404)
  }

  return c.json({ success: true, data: result.Item })
} catch (error) {
  console.error('[service]', 'Error message:', error)
  return c.json({ success: false, error: 'Failed to process' }, 500)
}
```

**Database Scripts Pattern**:

```typescript
try {
  // Operation
  console.log("✅ Success message");
} catch (error: unknown) {
  if (error instanceof Error && error.name === "SpecificError") {
    // Handle specific case
    return false;
  }
  console.error("❌ Error message:", error);
  throw error;
}
```

**Always**:

- Log service name prefix in backend: `console.error('[movies]', ...)`
- Return consistent JSON shapes: `{ success: boolean, data?: any, error?: string }`
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Type errors with `unknown` then narrow with `instanceof Error`

### Comments

**JSDoc for Functions** (especially exported):

```typescript
/**
 * Creates a Global Secondary Index (GSI) definition
 * @param indexName - Name of the index
 * @param hashKey - Partition key attribute name
 * @param rangeKey - Optional sort key attribute name
 * @returns GSI configuration object
 */
function createGSI(indexName: string, hashKey: string, rangeKey?: string) {
  // Implementation
}
```

**File Headers for Services**:

```typescript
/**
 * Movies Service Lambda Handler
 * Handles all movie-related operations
 */
```

### React/Frontend Specifics

- Use function declarations for components (not arrow functions at top level)
- Destructure props with defaults
- Use `className` with `cn()` utility for conditional classes
- Prefer composition with `asChild` pattern (Radix UI)

```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Git Workflow

### Commit Convention

Format: `<prefix>(<scope>): <description>`

**Prefixes**: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

**Examples**:

- `feat(auth): add OAuth2 authentication`
- `fix(bookings): resolve seat selection bug`
- `docs(api): update endpoints documentation`

**Rules**:

- Use imperative mood: "add" not "added"
- Keep under 72 characters
- Start with lowercase (unless proper noun)
- No period at end

See [docs/development/COMMIT_CONVENTION.md](docs/development/COMMIT_CONVENTION.md) for details.

### Branch Strategy

**Format**: `<type>/<issue-number>-<description>`

**Types**:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `release/` - Release preparation

**Examples**:

- `feature/123-user-authentication`
- `bugfix/456-seat-selection-fix`
- `hotfix/789-payment-crash`

Always branch from and merge to `main`. See [docs/development/BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md).

## Common Patterns

### API Response Shape

```typescript
// Success
{ success: true, data: T, count?: number }

// Error
{ success: false, error: string }
```

### Zod Validation

```typescript
const schema = z.object({
  title: z.string().min(1),
  runtime: z.number().positive(),
  genres: z.array(z.string()),
});

const result = schema.safeParse(body);
if (!result.success) {
  return c.json({ success: false, error: result.error.errors }, 400);
}
```

### DynamoDB Queries

```typescript
import { GetCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "@/shared/db/client";

const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAMES.MOVIES,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: { ":id": movieId },
  })
);
```

## Important Notes

- **Console logging**: Allowed (no-console is off)
- **Path aliases**: Use `@/*` in frontend (mapped to `./src/*`)
- **AWS SDK**: Use `@aws-sdk/lib-dynamodb` not `@aws-sdk/client-dynamodb` for data operations
- **Environment**: Local DynamoDB runs on `http://localhost:8000`
- **Ports**: Frontend (5173), Backend services (3000+), DynamoDB (8000), Admin UI (8001)

## Related Documentation

- [Quick Start](docs/guides/QUICK_START.md)
- [API Reference](docs/api/API_REFERENCE.md)
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md)
- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
