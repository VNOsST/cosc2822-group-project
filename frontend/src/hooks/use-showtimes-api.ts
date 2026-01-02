/**
 * Showtimes API Hooks
 * TanStack Query hooks for showtimes service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from "./use-api";
import { apiClient } from '@/lib/api-client'
import type { Showtime, ShowtimeWithDetails } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['showtimes'] as const,
  byDate: (date?: string) => ['showtimes', 'date', date] as const,
  byRoom: (roomId?: string) => ['showtimes', 'room', roomId] as const,
  detail: (id: string) => ['showtimes', id] as const,
}

// Queries
export function useShowtimes(params?: { date?: string; room_id?: string }) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v != null) as Array<
      [string, string]
    >,
  ).toString()
  const url = `/showtimes${queryString ? `?${queryString}` : ''}`

  let queryKey: Array<string>
  if (params?.date) {
    queryKey = ['showtimes', 'date', params.date]
  } else if (params?.room_id) {
    queryKey = ['showtimes', 'room', params.room_id]
  } else {
    queryKey = ['showtimes']
  }

  return useApiQuery<Array<ShowtimeWithDetails>>(queryKey, url)
}

export function useShowtime(id: string) {
  return useApiQuery<ShowtimeWithDetails>(
    [...QUERY_KEYS.detail(id)],
    `/showtimes/${id}`,
    {
      enabled: !!id,
    },
  )
}

// Mutations (Admin only - backend enforces this)
export function useCreateShowtime() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: {
      movie_id: string
      room_id: string
      start_time: string
      price: number
    }) => apiClient.post<Showtime>('/showtimes', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useCreateBulkShowtimes() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (
      data: Array<{
        movie_id: string
        room_id: string
        start_time: string
        price: number
      }>,
    ) => apiClient.post<Array<Showtime>>('/showtimes/bulk', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useUpdateShowtime() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({
      movieId,
      startTime,
      ...data
    }: { movieId: string; startTime: string } & Partial<Showtime>) =>
      apiClient.put<Showtime>(
        `/showtimes/${movieId}/schedule/${encodeURIComponent(startTime)}`,
        data,
      ),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useDeleteShowtime() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({ movieId, startTime }: { movieId: string; startTime: string }) =>
      apiClient.delete(
        `/showtimes/${movieId}/schedule/${encodeURIComponent(startTime)}`,
      ),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}
