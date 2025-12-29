import { Link, createFileRoute } from '@tanstack/react-router'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Mock data for showtimes
const MOCK_SHOWTIMES = [
  {
    id: '1',
    movieTitle: 'Dune: Part Two',
    roomName: 'Screen 1 - IMAX',
    date: '2024-12-25',
    times: ['10:00', '14:30', '19:00', '22:30'],
    price: 15.99,
  },
  {
    id: '2',
    movieTitle: 'Oppenheimer',
    roomName: 'Screen 2 - Dolby Atmos',
    date: '2024-12-25',
    times: ['11:00', '15:00', '20:00'],
    price: 14.99,
  },
  {
    id: '3',
    movieTitle: 'The Batman',
    roomName: 'Screen 3',
    date: '2024-12-25',
    times: ['13:00', '17:30', '21:00'],
    price: 12.99,
  },
  {
    id: '4',
    movieTitle: 'Interstellar',
    roomName: 'Screen 1 - IMAX',
    date: '2024-12-26',
    times: ['10:30', '14:00', '18:30'],
    price: 15.99,
  },
  {
    id: '5',
    movieTitle: 'The Grand Budapest Hotel',
    roomName: 'Screen 4',
    date: '2024-12-26',
    times: ['12:00', '16:00', '20:30'],
    price: 11.99,
  },
  {
    id: '6',
    movieTitle: 'Parasite',
    roomName: 'Screen 2 - Dolby Atmos',
    date: '2024-12-26',
    times: ['11:30', '15:30', '19:30'],
    price: 13.99,
  },
]

export const Route = createFileRoute('/public/showtimes')({
  component: PublicShowtimesPage,
})

function PublicShowtimesPage() {
  // Group showtimes by date
  const showtimesByDate = MOCK_SHOWTIMES.reduce(
    (acc, showtime) => {
      const date = showtime.date
      acc[date].push(showtime)
      return acc
    },
    {} as Record<string, typeof MOCK_SHOWTIMES>,
  )

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
      <div className="space-y-8">
        {Object.entries(showtimesByDate).map(([date, showtimes]) => (
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
              {showtimes.map((showtime) => (
                <Card
                  key={showtime.id}
                  className="border-slate-700/50 bg-slate-800/50 transition-colors hover:border-amber-500/30"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white">
                      {showtime.movieTitle}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="h-4 w-4" />
                      {showtime.roomName}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {showtime.times.map((time) => (
                        <Link
                          key={time}
                          to="/login"
                          search={{ redirect: '/user/bookings' }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {time}
                          </Button>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-slate-700 text-slate-300"
                      >
                        ${showtime.price.toFixed(2)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
