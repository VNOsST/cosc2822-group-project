import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Mock bookings data
const MOCK_BOOKINGS = [
  {
    id: '1',
    movieTitle: 'Dune: Part Two',
    roomName: 'Screen 1 - IMAX',
    date: '2024-12-25',
    time: '19:00',
    seats: ['A1', 'A2'],
    totalPrice: 31.98,
    status: 'confirmed',
  },
  {
    id: '2',
    movieTitle: 'Oppenheimer',
    roomName: 'Screen 2 - Dolby Atmos',
    date: '2024-12-26',
    time: '15:00',
    seats: ['C5'],
    totalPrice: 14.99,
    status: 'confirmed',
  },
  {
    id: '3',
    movieTitle: 'The Batman',
    roomName: 'Screen 3',
    date: '2024-12-20',
    time: '21:00',
    seats: ['B3', 'B4'],
    totalPrice: 25.98,
    status: 'completed',
  },
]

export const Route = createFileRoute('/user/bookings')({
  component: UserBookingsPage,
})

function UserBookingsPage() {
  const upcomingBookings = MOCK_BOOKINGS.filter((b) => b.status === 'confirmed')
  const pastBookings = MOCK_BOOKINGS.filter((b) => b.status === 'completed')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Bookings</h1>
        <p className="mt-1 text-slate-400">
          View and manage your movie bookings
        </p>
      </div>

      {/* Upcoming Bookings */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Ticket className="h-5 w-5 text-amber-500" />
          Upcoming Bookings
        </h2>
        {upcomingBookings.length === 0 ? (
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="py-8 text-center text-slate-400">
              No upcoming bookings. Browse movies to book your next experience!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBookings.map((booking) => (
              <Card
                key={booking.id}
                className="border-slate-700/50 bg-slate-800/50"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-white">
                      {booking.movieTitle}
                    </CardTitle>
                    <Badge className="bg-green-500/20 text-green-400">
                      Confirmed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {booking.roomName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {booking.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-slate-500">Seats: </span>
                      <span className="text-sm font-medium text-white">
                        {booking.seats.join(', ')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-amber-500">
                      ${booking.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Cancel Booking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-400">Past Bookings</h2>
        {pastBookings.length === 0 ? (
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="py-8 text-center text-slate-400">
              No past bookings yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pastBookings.map((booking) => (
              <Card
                key={booking.id}
                className="border-slate-700/50 bg-slate-800/30 opacity-70"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-slate-300">
                      {booking.movieTitle}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-slate-700 text-slate-400"
                    >
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {booking.time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
