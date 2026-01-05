/**
 * Bookings API Hooks
 * TanStack Query hooks for bookings service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { Booking, BookingWithDetails } from '@/lib/api-types'

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
  return useApiQuery<Array<BookingWithDetails>>(
    [...QUERY_KEYS.all],
    '/bookings',
  )
}

// Admin: Get all bookings with optional filters
export function useAllBookings(params?: {
  status?: string
  date?: string
  movie_id?: string
  search?: string
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(
      ([_, v]) => v != null && v !== 'all' && v !== '',
    ) as Array<[string, string]>,
  ).toString()
  const url = `/bookings/admin/all${queryString ? `?${queryString}` : ''}`

  return useApiQuery<Array<BookingWithDetails>>(
    [...QUERY_KEYS.all, 'admin', JSON.stringify(params || {})],
    url,
  )
}

export function useShowtimeBookings(showtimeId: string) {
  return useApiQuery<Array<Booking>>(
    [...QUERY_KEYS.showtime(showtimeId)],
    `/bookings/showtime/${showtimeId}`,
    {
      enabled: !!showtimeId,
    },
  )
}

export function useBooking(email: string, bookingId: string) {
  return useApiQuery<BookingWithDetails>(
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
