import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { serverApiClient } from '@/lib/server-api-client'
import type { ShowtimeWithDetails } from '@/lib/api-types'

export const Route = createFileRoute('/public/showtimes/$id')({
  // Server-side data loading
  loader: async ({ params }) => {
    try {
      const showtime = await serverApiClient.get<ShowtimeWithDetails>(
        `/showtimes/${params.id}`,
      )
      return { showtime, error: null }
    } catch (error) {
      console.error('Failed to load showtime details on server:', error)
      return { 
        showtime: null, 
        error: error instanceof Error ? error.message : 'Failed to load showtime details' 
      }
    }
  },
  component: ShowtimeDetailPage,
})

function ShowtimeDetailPage() {
  const navigate = useNavigate()
  const { showtime, error } = Route.useLoaderData()

  // Movie and room are now nested in the showtime response
  const movie = showtime?.movie
  const room = showtime?.room

  if (error || !showtime) {
    return (
      <div className="space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/public/showtimes' })}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Showtimes
        </Button>
        <ErrorState
          title="Failed to Load Showtime"
          message={error || 'Showtime not found'}
          actionLabel="Back to Showtimes"
          onAction={() => navigate({ to: '/public/showtimes' })}
        />
      </div>
    )
  }

  const startTime = new Date(showtime.start_time)
  const endTime = new Date(showtime.endtime)
  const availableSeats =
    (movie?.runtime ? Math.floor(movie.runtime / 2) : 100) -
    showtime.occupied_seats.length

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/public/showtimes' })}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Showtimes
      </Button>

      {/* Header */}
      <div className="text-center">
        <h1 className="bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Showtime Details
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Review the details and book your seats
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Movie Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Showtime Card */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Showtime Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-semibold text-white">
                      {startTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Time</p>
                    <p className="font-semibold text-white">
                      {startTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {endTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <MapPin className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Room</p>
                    <p className="font-semibold text-white">
                      {room?.name || `Room ${showtime.room_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <DollarSign className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Price per Seat</p>
                    <p className="font-semibold text-white">
                      ${showtime.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                <Users className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Seat Availability</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-semibold text-white">
                      {availableSeats} seats available
                    </p>
                    <Badge
                      variant={availableSeats > 20 ? 'default' : 'destructive'}
                      className={
                        availableSeats > 20
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : 'bg-red-500/20 text-red-400 border-red-500/50'
                      }
                    >
                      {showtime.occupied_seats.length} occupied
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movie Details */}

          {movie && (
            <Card className="border-slate-700/50 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  About the Movie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {movie.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {movie.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-amber-500/50 text-amber-400"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {movie.synopsis}
                  </p>
                </div>
                <Link to="/public/movies/$id" params={{ id: movie.id }}>
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    View Full Movie Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 border-amber-500/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Ready to Book?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {movie && (
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">
                    {startTime.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Time</span>
                  <span className="text-white">
                    {startTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Room</span>
                  <span className="text-white">
                    {room?.name || `Room ${showtime.room_id}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-400">Price</span>
                  <span className="text-amber-400">
                    ${showtime.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/login" search={{ redirect: '/user/bookings' }}>
                <Button
                  className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                  size="lg"
                  disabled={availableSeats === 0}
                >
                  {availableSeats === 0 ? 'Sold Out' : 'Book Tickets'}
                </Button>
              </Link>

              <p className="text-center text-xs text-slate-500">
                Login required to complete booking
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
