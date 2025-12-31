/**
 * Bookings API Hooks
 * TanStack Query hooks for bookings service endpoints
 */

import { useApiQuery, useApiMutation, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { Booking } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['bookings'] as const,
  user: (email: string) => ['bookings', 'user', email] as const,
  showtime: (showtimeId: string) =>
    ['bookings', 'showtime', showtimeId] as const,
  detail: (email: string, bookingId: string) =>
    ['bookings', email, bookingId] as const,
}

// Queries
export function useUserBookings() {
  return useApiQuery<Booking[]>([...QUERY_KEYS.all], '/bookings')
}

export function useShowtimeBookings(showtimeId: string) {
  return useApiQuery<Booking[]>(
    [...QUERY_KEYS.showtime(showtimeId)],
    `/bookings/showtime/${showtimeId}`,
    {
      enabled: !!showtimeId,
    },
  )
}

export function useBooking(email: string, bookingId: string) {
  return useApiQuery<Booking>(
    [...QUERY_KEYS.detail(email, bookingId)],
    `/bookings/${email}/${bookingId}`,
    {
      enabled: !!email && !!bookingId,
    },
  )
}

// Mutations
export function useCreateBooking() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: {
      user_email: string
      user_id: string
      showtime_id: string
      movie_id: string
      seats: Array<string>
      total_amount: number
    }) => apiClient.post<Booking>('/bookings', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useCancelBooking() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({ email, bookingId }: { email: string; bookingId: string }) =>
      apiClient.delete(`/bookings/${email}/${bookingId}`),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}
