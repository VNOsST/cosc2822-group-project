import { Link, createFileRoute } from '@tanstack/react-router'
import { Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { serverApiClient } from '@/lib/server-api-client'
import type { Movie } from '@/lib/api-types'

export const Route = createFileRoute('/public/movies/')({
  ssr: 'data-only',
  loader: async () => {
    try {
      const movies = await serverApiClient.get<Array<Movie>>("/movies");
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
          <Card
            key={movie.id}
            className="group overflow-hidden border-slate-700/50 bg-slate-800/50 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="relative aspect-2/3 overflow-hidden">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
              <Badge className="absolute right-2 top-2 bg-amber-500 text-slate-900">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {movie.rating.toFixed(1)}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-white">
                {movie.title}
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {movie.genres.slice(0, 2).map((genre) => (
                  <Badge
                    key={genre}
                    variant="outline"
                    className="border-slate-600 text-slate-400"
                  >
                    {genre}
                  </Badge>
                ))}
                <span className="flex items-center text-xs text-slate-500">
                  <Clock className="mr-1 h-3 w-3" />
                  {movie.runtime} min
                </span>
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                {movie.synopsis}
              </p>
              <div className="flex gap-2">
                <Link
                  to="/public/movies/$id"
                  params={{ id: movie.id }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    View Details
                  </Button>
                </Link>
                <Link to="/public/showtimes" className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                  >
                    Book Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
