import { useMovieRatings } from './use-ratings-api'
import type { Movie } from '@/lib/api-types'

/**
 * Hook to calculate a composite rating for a movie
 * Combines user ratings, TMDB rating, and TMDB popularity
 */
export function useCompositeRating(movie: Movie) {
  const { data: ratings, isLoading } = useMovieRatings(movie.id)

  const userAvg =
    ratings && ratings.length > 0
      ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
      : null

  const tmdbRating = movie.rating // 0-10
  const tmdbPopularity = movie.tmdb_popularity_score // ~0-100+

  let score: number
  let explanation: string

  const popularityContribution = Math.min(tmdbPopularity / 10, 10)

  if (userAvg !== null) {
    // 40% User Avg, 30% TMDB Rating, 30% Popularity
    score = userAvg * 0.4 + tmdbRating * 0.3 + popularityContribution * 0.3
    explanation = `Composite score based on 40% User Ratings (${userAvg.toFixed(1)}), 30% TMDB Rating (${tmdbRating.toFixed(1)}), and 30% Popularity (${popularityContribution.toFixed(1)}/10)`
  } else {
    // 60% TMDB Rating, 40% Popularity (when no user ratings exist)
    score = tmdbRating * 0.6 + popularityContribution * 0.4
    explanation = `Composite score based on 60% TMDB Rating (${tmdbRating.toFixed(1)}) and 40% Popularity (${popularityContribution.toFixed(1)}/10) (No user ratings yet)`
  }

  return {
    score,
    explanation,
    isLoading,
    userAvg,
    ratingsCount: ratings?.length || 0,
    tmdbRating,
    popularityContribution,
  }
}
