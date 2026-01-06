/**
 * Admin Notifications API Hooks
 * TanStack Query hooks for admin notifications service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { AdminSubscription } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['admin-notifications'] as const,
  subscriptions: ['admin-notifications', 'subscriptions'] as const,
}

// Queries
export function useAdminSubscriptions() {
  return useApiQuery<Array<AdminSubscription>>(
    [...QUERY_KEYS.subscriptions],
    '/admin/notifications/subscriptions',
  )
}

// Mutations
export function useSubscribeAdmin() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: { email: string }) =>
      apiClient.post<AdminSubscription>('/admin/notifications/subscribe', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.subscriptions]),
    },
  )
}

export function useUnsubscribeAdmin() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: { email?: string; subscriptionArn?: string }) =>
      apiClient.post<void>('/admin/notifications/unsubscribe', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.subscriptions]),
    },
  )
}

export function useTestAdminNotification() {
  return useApiMutation(() =>
    apiClient.post<{ message: string; sentAt: string }>(
      '/admin/notifications/test',
      {},
    ),
  )
}
