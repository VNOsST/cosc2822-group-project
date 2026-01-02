/**
 * Users API Hooks
 * TanStack Query hooks for users service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { User, UserRole } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
}

// Queries
export function useUsers() {
  return useApiQuery<Array<User>>([...QUERY_KEYS.all], '/users')
}

export function useUser(id: string) {
  return useApiQuery<User>([...QUERY_KEYS.detail(id)], `/users/${id}`, {
    enabled: !!id,
  })
}

// Mutations
export function useUpdateUserRole() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({ userId, role }: { userId: string; role: UserRole }) =>
      apiClient.put<{ id: string; role: UserRole }>(`/users/${userId}/role`, {
        role,
      }),
    {
      onSuccess: (_, { userId }) => {
        invalidate([...QUERY_KEYS.all])
        invalidate([...QUERY_KEYS.detail(userId)])
      },
    },
  )
}

