/**
 * Movies API Hooks
 * TanStack Query hooks for movies service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { Movie, Showtime } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['movies'] as const,
  detail: (id: string) => ['movies', id] as const,
  showtimes: (id: string) => ['movies', id, 'showtimes'] as const,
}

// Queries
export function useMovies() {
  return useApiQuery<Array<Movie>>([...QUERY_KEYS.all], '/movies')
}

export function useMovie(id: string) {
  return useApiQuery<Movie>([...QUERY_KEYS.detail(id)], `/movies/${id}`, {
    enabled: !!id,
  })
}

export function useMovieShowtimes(id: string) {
  return useApiQuery<Array<Showtime>>(
    [...QUERY_KEYS.showtimes(id)],
    `/movies/${id}/showtimes`,
    {
      enabled: !!id,
    },
  )
}

// Mutations (Admin only - backend middleware enforces this)
export function useCreateMovie() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: Omit<Movie, 'id' | 'rating' | 'created_at' | 'updated_at'>) =>
      apiClient.post<Movie>('/movies', data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useUpdateMovie() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({ id, ...data }: Partial<Movie> & { id: string }) =>
      apiClient.put<Movie>(`/movies/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        invalidate([...QUERY_KEYS.all])
        invalidate([...QUERY_KEYS.detail(id)])
      },
    },
  )
}

export function useDeleteMovie() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation((id: string) => apiClient.delete(`/movies/${id}`), {
    onSuccess: () => invalidate([...QUERY_KEYS.all]),
  })
}
