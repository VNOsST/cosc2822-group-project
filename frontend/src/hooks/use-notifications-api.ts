/**
 * User Notifications API Hooks
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'

export interface UserNotification {
  id: string
  user_id: string
  type: 'rating_prompt' | 'reminder_1day' | 'reminder_1hour' | 'showtime_update' | 'showtime_cancelled'
  message: string
  sent_at: string
  read: boolean
  metadata?: {
    movie_id?: string
    showtime_id?: string
    booking_id?: string
    movie_title?: string
  }
}

const QUERY_KEYS = {
  all: ['notifications'] as const,
}

// Queries
export function useNotifications() {
  return useApiQuery<Array<UserNotification>>(
    [...QUERY_KEYS.all],
    '/notifications',
  )
}

// Mutations
export function useMarkNotificationAsRead() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (id: string) => apiClient.patch<void>(`/notifications/${id}/read`, {}),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useDeleteNotification() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (id: string) => apiClient.delete<void>(`/notifications/${id}`),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}
