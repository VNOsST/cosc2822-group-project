import { createFileRoute } from '@tanstack/react-router'
import { ErrorState } from '@/components/error-state'
import { MovieCard } from '@/components/movie-card'
import { serverApiClient } from '@/lib/server-api-client'
import type { Movie } from '@/lib/api-types'

export const Route = createFileRoute('/public/movies/')({
  ssr: 'data-only',
  loader: async () => {
    try {
      const movies = await serverApiClient.get<Array<Movie>>('/movies')
      return { movies, error: null }
    } catch (error) {
      console.error('Failed to load movies on server:', error)
      return {
        movies: [],
        error: error instanceof Error ? error.message : 'Failed to load movies',
      }
    }
  },
  component: PublicMoviesPage,
})

function PublicMoviesPage() {
  const { movies, error } = Route.useLoaderData()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Now Showing
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Discover the latest blockbusters and book your seats today
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to Load Movies"
          message={error}
          actionLabel="Refresh Page"
          onAction={() => window.location.reload()}
        />
      )}

      {/* Movies Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {movies?.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {!error && movies?.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg text-slate-400">
            No movies available at the moment
          </p>
        </div>
      )}
    </div>
  )
}
