import { createFileRoute } from '@tanstack/react-router'
import {
  Calendar,
  DoorOpen,
  Film,
  MessageSquare,
  Ticket,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { bookings, movies, reviews, rooms, showtimes } from '@/data/dummy-data'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed',
  ).length
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length
  const spamReviews = reviews.filter((r) => r.isSpam).length
  const activeRooms = rooms.filter((r) => r.isActive).length
  const nowShowingMovies = movies.filter((m) => m.isNowShowing).length

  const stats = [
    {
      title: 'Active Rooms',
      value: activeRooms,
      total: rooms.length,
      icon: DoorOpen,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Now Showing',
      value: nowShowingMovies,
      total: movies.length,
      icon: Film,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Showtimes',
      value: showtimes.length,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Bookings',
      value: confirmedBookings,
      subtitle: `${pendingBookings} pending`,
      icon: Ticket,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Reviews',
      value: reviews.length - spamReviews,
      subtitle: `${spamReviews} spam`,
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Total Capacity',
      value: rooms.reduce((sum, r) => sum + r.capacity, 0),
      icon: Users,
      color: 'from-teal-500 to-cyan-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to CineCloud Admin. Here&apos;s an overview of your cinema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div
                className={`rounded-lg bg-linear-to-br ${stat.color} p-2 text-white`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.total && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {stat.total}
                  </span>
                )}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.slice(0, 4).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.seats.join(', ')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : booking.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Showtimes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showtimes.slice(0, 4).map((showtime) => {
                const movie = movies.find((m) => m.id === showtime.movieId)
                const room = rooms.find((r) => r.id === showtime.roomId)
                return (
                  <div
                    key={showtime.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{movie?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {room?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(showtime.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showtime.availableSeats} seats left
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
