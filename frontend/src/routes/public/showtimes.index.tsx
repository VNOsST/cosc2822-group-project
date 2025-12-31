import { Link, createFileRoute } from '@tanstack/react-router'
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useShowtimes } from '@/hooks/use-showtimes-api'

export const Route = createFileRoute('/public/showtimes/')({
  component: PublicShowtimesPage,
})

function PublicShowtimesPage() {
  const { data: showtimes, isLoading, error } = useShowtimes()

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-400">Failed to load showtimes</p>
          <p className="mt-2 text-sm text-slate-400">
            {error.message || 'Please try again later'}
          </p>
        </div>
      </div>
    )
  }

  // Group showtimes by date
  const showtimesByDate =
    showtimes?.reduce(
      (acc, showtime) => {
        const date = new Date(showtime.start_time).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(showtime)
        return acc
      },
      {} as Record<string, typeof showtimes>,
    ) || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Showtimes
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Find the perfect time for your movie experience
        </p>
      </div>

      {/* Showtimes by Date */}
      {Object.keys(showtimesByDate).length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-slate-400">
            No showtimes available at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(showtimesByDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, dateShowtimes]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-semibold text-white">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dateShowtimes.map((showtime) => (
                    <Card
                      key={showtime.showtime_id}
                      className="border-slate-700/50 bg-slate-800/50 transition-colors hover:border-amber-500/30"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-white">
                          <Link
                            to="/public/movies/$id"
                            params={{ id: showtime.movie_id }}
                            className="hover:text-amber-400 transition-colors"
                          >
                            {showtime.movie?.title || 'Unknown Movie'}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-4 w-4" />
                          {showtime.room?.name || `Room ${showtime.room_id}`}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                              asChild
                            >
                              <Link
                                to="/public/showtimes/$id"
                                params={{ id: showtime.showtime_id }}
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(showtime.start_time).toLocaleTimeString(
                                  'en-US',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </Link>
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="bg-slate-700 text-slate-300"
                            >
                              ${showtime.price.toFixed(2)}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {showtime.occupied_seats.length} seats taken
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

