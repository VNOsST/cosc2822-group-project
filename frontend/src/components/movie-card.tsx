import { Link } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import type { Movie } from '@/lib/api-types'
import { MovieRatingDisplay } from './movie-rating-display'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Card className="group overflow-hidden border-slate-700/50 bg-slate-800/50 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
      <div className="relative aspect-2/3 overflow-hidden">
        <RemoteImage
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
        <MovieRatingDisplay
          movie={movie}
          className="absolute right-2 top-2"
          size="sm"
        />
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
  )
}
