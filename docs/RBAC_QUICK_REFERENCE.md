# RBAC Quick Reference Guide

## For Backend Developers

### Protecting Routes

```typescript
import { adminOnly, requireAuth, requireRole, getUser } from '../../shared/middleware'

// Public endpoint (no auth needed)
app.get('/movies', async (c) => { ... })

// Any authenticated user
app.get('/bookings', requireAuth(), async (c) => {
  const user = getUser(c) // Get authenticated user
  // user.sub, user.email, user.groups available
})

// Admin only
app.post('/movies', adminOnly(), async (c) => { ... })
app.put('/movies/:id', adminOnly(), async (c) => { ... })
app.delete('/movies/:id', adminOnly(), async (c) => { ... })

// Multiple roles (OR logic - any role matches)
app.get('/analytics', requireRole(['Admins', 'Users']), async (c) => {
  const user = getUser(c)
  if (user.groups.includes('Admins')) {
    return getAllAnalytics()
  }
  return getUserAnalytics(user.sub)
})
```

### Response Patterns

```typescript
// Success
return c.json({ success: true, data: result }, 200);

// Created
return c.json({ success: true, data: created, message: "..." }, 201);

// Not found
return c.json({ success: false, error: "Not found" }, 404);

// Validation error
return c.json({ success: false, error: validationErrors }, 400);

// Server error
return c.json({ success: false, error: "Failed to process" }, 500);
```

## For Frontend Developers

### Using API Hooks

```typescript
import {
  useMovies,
  useCreateMovie,
  useDeleteMovie,
} from "@/hooks/use-movies-api";

function MoviesList() {
  // Query hooks
  const { data: movies, isLoading, error } = useMovies();

  // Mutation hooks
  const createMovie = useCreateMovie();
  const deleteMovie = useDeleteMovie();

  const handleCreate = async (movieData) => {
    try {
      await createMovie.mutateAsync(movieData);
      // Success! Query cache automatically invalidated
    } catch (err) {
      // Handle error (403 if not admin, 401 if not logged in)
      console.error(err);
    }
  };

  return (
    <div>
      {isLoading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {movies?.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

### Creating New API Hooks

Follow this pattern:

```typescript
// hooks/use-YOUR-SERVICE-api.ts
import { useApiQuery, useApiMutation, useInvalidateQueries } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { YourType } from "@/lib/api-types";

const QUERY_KEYS = {
  all: ["your-service"] as const,
  detail: (id: string) => ["your-service", id] as const,
};

// Queries
export function useYourItems() {
  return useApiQuery<YourType[]>([...QUERY_KEYS.all], "/your-endpoint");
}

export function useYourItem(id: string) {
  return useApiQuery<YourType>(
    [...QUERY_KEYS.detail(id)],
    `/your-endpoint/${id}`,
    { enabled: !!id }
  );
}

// Mutations
export function useCreateYourItem() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation(
    (data: CreateYourItemData) =>
      apiClient.post<YourType>("/your-endpoint", data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    }
  );
}

export function useUpdateYourItem() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation(
    ({ id, ...data }: { id: string } & Partial<YourType>) =>
      apiClient.put<YourType>(`/your-endpoint/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        invalidate([...QUERY_KEYS.all]);
        invalidate([...QUERY_KEYS.detail(id)]);
      },
    }
  );
}

export function useDeleteYourItem() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation(
    (id: string) => apiClient.delete(`/your-endpoint/${id}`),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    }
  );
}
```

### Checking User Role

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "Admins";

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      {isAdmin && <AdminControls />}
      <UserContent />
    </div>
  );
}
```

## Testing Checklist

- [ ] Deploy backend with `sam deploy`
- [ ] Note CloudFormation outputs (UserPoolId, UserPoolClientId, ApiEndpoint)
- [ ] Update frontend `.env` with Cognito credentials
- [ ] Create admin user in Cognito Console
- [ ] Add admin user to `Admins` group
- [ ] Create regular user in Cognito Console
- [ ] Add regular user to `Users` group
- [ ] Login as admin at `/login`
- [ ] Navigate to `/admin/rbac-test`
- [ ] Test creating movies, rooms, showtimes (should succeed)
- [ ] Logout and login as regular user
- [ ] Navigate to `/admin/rbac-test`
- [ ] Test creating movies (should fail with 403)
- [ ] Check browser console for error messages
- [ ] Verify backend logs show authorization checks

## Common Patterns

### Admin Dashboard with CRUD

```typescript
function AdminMovies() {
  const { data: movies } = useMovies();
  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();

  return (
    <div>
      <CreateForm onSubmit={createMovie.mutateAsync} />
      {movies?.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onUpdate={(data) =>
            updateMovie.mutateAsync({ id: movie.id, ...data })
          }
          onDelete={() => deleteMovie.mutateAsync(movie.id)}
        />
      ))}
    </div>
  );
}
```

### Conditional UI based on Role

```typescript
function MovieActions({ movieId }: { movieId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admins";
  const deleteMovie = useDeleteMovie();

  return (
    <div>
      <BookmarkButton movieId={movieId} /> {/* All users */}
      {isAdmin && (
        <Button onClick={() => deleteMovie.mutateAsync(movieId)}>Delete</Button>
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
export function useUpdateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Movie>) =>
      apiClient.put<Movie>(`/movies/${id}`, data),
    onMutate: async ({ id, ...newData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["movies", id] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(["movies", id]);

      // Optimistically update
      queryClient.setQueryData(["movies", id], (old: Movie) => ({
        ...old,
        ...newData,
      }));

      return { previous };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["movies", id], context.previous);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["movies", id] });
    },
  });
}
```

## Security Best Practices

1. **Never trust the client**: Always validate on backend
2. **Use middleware consistently**: Apply to all protected routes
3. **Log authorization failures**: Monitor for unauthorized access attempts
4. **Test with different roles**: Verify permissions work as expected
5. **Keep JWT tokens secure**: Never log or expose tokens
6. **Use HTTPS in production**: Encrypt all traffic
7. **Implement rate limiting**: Prevent abuse
8. **Audit admin actions**: Log who did what and when

## Error Handling

```typescript
function MyComponent() {
  const createMovie = useCreateMovie();

  const handleSubmit = async (data) => {
    try {
      await createMovie.mutateAsync(data);
      toast.success("Movie created!");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error("You do not have permission to perform this action");
        } else if (error.status === 401) {
          toast.error("Please log in to continue");
          router.push("/login");
        } else {
          toast.error(error.message || "An error occurred");
        }
      }
    }
  };

  return <Form onSubmit={handleSubmit} />;
}
```

---

**Quick Links:**

- [Full Implementation Guide](RBAC_IMPLEMENTATION.md)
- [API Integration Guide](API_INTEGRATION_GUIDE.md)
- [Backend Middleware](backend/src/shared/middleware/auth.ts)
- [Test Dashboard](frontend/src/components/rbac-test-dashboard.tsx)
