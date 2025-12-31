# AGENTS.md - CineCloud Development Guide for AI Agents

## Project Overview

CineCloud is a cinema booking platform with microservices architecture:
- **Frontend**: TanStack Start + React 19 + Tailwind CSS + TanStack Query
- **Backend**: Hono API (Lambda) with Cognito JWT authentication
- **Database**: DynamoDB (local dev on port 8000)
- **Auth**: AWS Cognito with role-based access control (Admins/Users)

## Build, Lint & Test Commands

```bash
# Frontend (frontend/)
bun dev                # Dev server (port 5173)
bun build              # Production build
bun test               # Run all tests with Vitest
bun test path/to/file  # Run single test file
bun test --watch       # Watch mode
bun lint               # Run oxlint
bun format             # Format with oxfmt
bun check              # Format + lint (auto-fix)

# Backend (backend/)
bun dev                # Start all services
bun dev:movies         # Single service (port 3002)
bun build:lambda       # Build for AWS Lambda

# Database (database/)
bun reset              # Full reset (teardown + setup + seed)
bun setup && bun seed  # Create tables and seed data
```

## Code Style Guidelines

### Imports (enforced by oxlint)
```typescript
// 1. External packages
import { useQuery } from '@tanstack/react-query'
// 2. Internal absolute (@/*)
import { apiClient } from '@/lib/api-client'
// 3. Relative imports
import { helper } from './utils'
// 4. Type-only imports
import type { Movie } from '@/lib/api-types'
```

### Formatting
- No semicolons, single quotes, trailing commas
- 2 spaces indentation
- Prefer `Array<T>` over `T[]`

### Naming Conventions
- **Files**: kebab-case (`use-movies-api.ts`)
- **Components/Types**: PascalCase (`MovieCard`, `Booking`)
- **Functions/Variables**: camelCase (`fetchMovies`)
- **Constants**: UPPER_SNAKE_CASE (`QUERY_KEYS`)

## API Integration Patterns

### API Client (`@/lib/api-client`)
Uses AWS Amplify for automatic JWT authentication:
```typescript
import { apiClient } from '@/lib/api-client'

// GET request
const movies = await apiClient.get<Movie[]>('/movies')

// POST with body
const movie = await apiClient.post<Movie>('/movies', { title: 'Inception' })

// With query params
const results = await apiClient.get<Movie[]>('/movies', {
  queryParams: { genre: 'action' }
})
```

### TanStack Query Hooks Pattern
Create domain-specific hooks in `src/hooks/use-{domain}-api.ts`:

```typescript
// 1. Define query keys for cache management
const QUERY_KEYS = {
  all: ['movies'] as const,
  detail: (id: string) => ['movies', id] as const,
}

// 2. Query hooks for data fetching
export function useMovies() {
  return useApiQuery<Movie[]>([...QUERY_KEYS.all], '/movies')
}

export function useMovie(id: string) {
  return useApiQuery<Movie>([...QUERY_KEYS.detail(id)], `/movies/${id}`, {
    enabled: !!id,  // Only fetch when id exists
  })
}

// 3. Mutation hooks with cache invalidation
export function useCreateMovie() {
  const { invalidate } = useInvalidateQueries()
  return useApiMutation(
    (data: CreateMovieDto) => apiClient.post<Movie>('/movies', data),
    { onSuccess: () => invalidate([...QUERY_KEYS.all]) }
  )
}
```

### Using Hooks in Components
```typescript
function MovieList() {
  const { data: movies, isLoading, error } = useMovies()
  const { mutate: createMovie, isPending } = useCreateMovie()

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <MovieGrid movies={movies} onCreate={createMovie} />
}
```

### Authentication Context
```typescript
import { useAuth } from '@/hooks/use-auth'

function Component() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()

  // user.role is 'Admins' | 'Users' | 'unauthenticated'
  if (user?.role === 'Admins') { /* admin UI */ }
}
```

## Backend RBAC Middleware

Apply auth middleware to protect routes:
```typescript
import { requireAuth, requireRole, adminOnly, getUser } from '@/shared/middleware/auth'

// Any authenticated user
app.get('/bookings', requireAuth(), (c) => { ... })

// Admin only
app.post('/movies', adminOnly(), (c) => { ... })

// Specific roles
app.put('/rooms/:id', requireRole(['Admins']), (c) => { ... })

// Access user in handler
app.get('/profile', requireAuth(), (c) => {
  const user = getUser(c)  // { sub, email, groups }
  return c.json({ userId: user.sub })
})
```

## API Response Shape

All endpoints return consistent JSON:
```typescript
// Success
{ success: true, data: T, count?: number }

// Error
{ success: false, error: string }
```

## Error Handling

### Backend (Hono)
```typescript
try {
  const result = await docClient.send(new GetCommand({ ... }))
  if (!result.Item) {
    return c.json({ success: false, error: 'Not found' }, 404)
  }
  return c.json({ success: true, data: result.Item })
} catch (error) {
  console.error('[movies]', 'Error:', error)
  return c.json({ success: false, error: 'Operation failed' }, 500)
}
```

### Frontend (React Query)
```typescript
const { error } = useMovies()
if (error instanceof ApiError) {
  // error.status, error.message available
}
```

## Git Workflow

**Commit Format**: `<prefix>(<scope>): <description>`
- `feat(movies): add search endpoint`
- `fix(bookings): resolve seat selection bug`

**Branch Format**: `<type>/<issue>-<description>`
- `feature/123-user-authentication`
- `bugfix/456-booking-fix`

## Key Files Reference

- `frontend/src/lib/api-client.ts` - Amplify REST client wrapper
- `frontend/src/lib/api-types.ts` - Shared type definitions
- `frontend/src/hooks/use-api.ts` - Base query/mutation hooks
- `frontend/src/hooks/use-{domain}-api.ts` - Domain-specific hooks
- `frontend/src/lib/auth-context.tsx` - Authentication provider
- `backend/src/shared/middleware/auth.ts` - RBAC middleware
