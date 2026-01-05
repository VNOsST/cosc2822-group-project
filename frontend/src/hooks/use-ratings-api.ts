/**
 * Ratings API Hooks
 * TanStack Query hooks for ratings service endpoints
 */

import { useApiMutation, useApiQuery, useInvalidateQueries } from './use-api'
import { apiClient } from '@/lib/api-client'
import type { MovieRating } from '@/lib/api-types'

const QUERY_KEYS = {
  all: ['ratings'] as const,
  movie: (movieId: string) => ['ratings', 'movie', movieId] as const,
  user: (userId: string) => ['ratings', 'user', userId] as const,
}

// Queries
export function useMovieRatings(movieId: string) {
  return useApiQuery<Array<MovieRating>>(
    [...QUERY_KEYS.movie(movieId)],
    `/ratings/movie/${movieId}`,
    {
      enabled: !!movieId,
    },
  )
}

export function useUserRatings(userId: string) {
  return useApiQuery<Array<MovieRating>>(
    [...QUERY_KEYS.user(userId)],
    `/ratings/user/${userId}`,
    {
      enabled: !!userId,
    },
  )
}

// Admin-only: Fetch all ratings
export function useAllRatings() {
  return useApiQuery<Array<MovieRating>>([...QUERY_KEYS.all], '/ratings/all')
}

// Mutations
export function useCreateRating() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    (data: {
      user_id: string
      movie_id: string
      rating: number
      review?: string
      image_keys?: Array<string>
    }) => apiClient.post<MovieRating>('/ratings', data),
    {
      onSuccess: (_, variables) => {
        invalidate([...QUERY_KEYS.movie(variables.movie_id)])
        invalidate([...QUERY_KEYS.user(variables.user_id)])
      },
    },
  )
}

export function useUpdateRating() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation(
    ({
      id,
      ...data
    }: {
      id: string
      rating?: number
      review?: string
      image_keys?: Array<string>
    }) => apiClient.put<MovieRating>(`/ratings/${id}`, data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    },
  )
}

export function useDeleteRating() {
  const { invalidate } = useInvalidateQueries()

  return useApiMutation((id: string) => apiClient.delete(`/ratings/${id}`), {
    onSuccess: () => invalidate([...QUERY_KEYS.all]),
  })
}
