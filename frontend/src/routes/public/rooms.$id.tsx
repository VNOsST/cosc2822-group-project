import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Users, Monitor, Calendar, Clock, Film } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import { ErrorState } from '@/components/error-state'
import { serverApiClient } from '@/lib/server-api-client'
import type { Room, ShowtimeWithDetails } from '@/lib/api-types'

export const Route = createFileRoute('/public/rooms/$id')({
  ssr: 'data-only',
  // Server-side data loading
  loader: async ({ params }) => {
    try {
      const [room, showtimes] = await Promise.all([
        serverApiClient.get<Room>(`/rooms/${params.id}`),
        serverApiClient.get<Array<ShowtimeWithDetails>>(
          `/showtimes?room_id=${params.id}`,
        ),
      ])
      return { room, showtimes, error: null }
    } catch (error) {
      console.error('Failed to load room details on server:', error)
      return {
        room: null,
        showtimes: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load room details',
      }
    }
  },
  component: RoomDetailPage,
})

function RoomDetailPage() {
  const navigate = useNavigate()
  const { room, showtimes, error } = Route.useLoaderData()

  // Show error state if room failed to load
  if (error || !room) {
    return (
      <div className="space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/public/rooms' })}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
        <ErrorState
          title="Failed to Load Room"
          message={error || 'Room not found'}
          actionLabel="Back to Rooms"
          onAction={() => navigate({ to: '/public/rooms' })}
        />
      </div>
    )
  }

  // Generate seat map for floor plan visualization
  const seatMap: Array<{ id: string; status: 'available' | 'unavailable' }> =
    []
  const { rows, columns } = room.layout_config
  const unavailableSeats = new Set(room.unavailable || [])

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row) // A, B, C...
    for (let col = 1; col <= columns; col++) {
      const seatId = `${rowLetter}${col}`
      seatMap.push({
        id: seatId,
        status: unavailableSeats.has(seatId) ? 'unavailable' : 'available',
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/public/rooms' })}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Rooms
      </Button>

      {/* Hero Section */}
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">{room.name}</h1>
          <Badge className="bg-amber-500 text-slate-900">
            <Monitor className="mr-1 h-4 w-4" />
            {room.screen_type}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-slate-400">Capacity</p>
              <p className="font-semibold text-white">{room.capacity} seats</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <Monitor className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-slate-400">Layout</p>
              <p className="font-semibold text-white">
                {rows} rows × {columns} columns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <Film className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-slate-400">Showtimes</p>
              <p className="font-semibold text-white">
                {showtimes?.length || 0} upcoming
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {room.room_image_urls && room.room_image_urls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Gallery</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {room.room_image_urls.map((url, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-slate-700/50"
              >
                <RemoteImage
                  src={url}
                  alt={`${room.name} - Image ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floor Plan */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Floor Plan</h2>
        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="p-6">
            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded border border-slate-600 bg-slate-700" />
                <span className="text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded border border-slate-600 bg-slate-600" />
                <span className="text-slate-400">Unavailable</span>
              </div>
            </div>

            {/* Screen */}
            <div className="mb-6 rounded bg-slate-700 py-2 text-center text-sm font-semibold text-slate-400">
              SCREEN
            </div>

            {/* Seat Grid */}
            <div className="flex flex-col gap-2">
              {Array.from({ length: rows }, (_, rowIndex) => {
                const rowLetter = String.fromCharCode(65 + rowIndex)
                const rowSeats = seatMap.filter((seat) =>
                  seat.id.startsWith(rowLetter),
                )

                return (
                  <div key={rowLetter} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm font-semibold text-slate-500">
                      {rowLetter}
                    </span>
                    <div className="flex flex-1 justify-center gap-1">
                      {rowSeats.map((seat) => (
                        <div
                          key={seat.id}
                          className={`flex h-6 w-6 items-center justify-center rounded border text-xs ${
                            seat.status === 'unavailable'
                              ? 'border-slate-600 bg-slate-600 text-slate-500'
                              : 'border-slate-600 bg-slate-700 text-slate-400'
                          }`}
                          title={seat.id}
                        >
                          {seat.id.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Showtimes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <Film className="h-6 w-6 text-amber-500" />
            Upcoming Showtimes
          </h2>
        </div>

        {showtimes && showtimes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showtimes.map((showtime) => (
              <Card
                key={showtime.showtime_id}
                className="border-slate-700/50 bg-slate-800/50 transition-colors hover:border-amber-500/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {showtime.movie?.poster_url && (
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded">
                        <RemoteImage
                          src={showtime.movie.poster_url}
                          alt={showtime.movie.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base text-white">
                        {showtime.movie?.title || 'Unknown Movie'}
                      </CardTitle>
                      <p className="text-xs text-slate-400">
                        {showtime.movie?.runtime
                          ? `${showtime.movie.runtime} min`
                          : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(showtime.start_time).toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {new Date(showtime.start_time).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-slate-700 text-slate-300"
                    >
                      ${showtime.price.toFixed(2)}
                    </Badge>
                  </div>
                  <Link
                    to="/public/showtimes/$id"
                    params={{ id: showtime.showtime_id }}
                  >
                    <Button
                      size="sm"
                      className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                    >
                      View Showtime
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="py-8 text-center">
              <p className="text-slate-400">
                No upcoming showtimes for this room at the moment
              </p>
              <Link to="/public/showtimes">
                <Button
                  className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400"
                  size="sm"
                >
                  View All Showtimes
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
