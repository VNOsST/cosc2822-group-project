import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useCancelBooking, useUserBookings } from '@/hooks/use-bookings-api'
import { formatCurrency } from '@/lib/utils'
import type { BookingWithDetails } from '@/lib/api-types'

export const Route = createFileRoute('/user/bookings')({
  component: UserBookingsPage,
})

function UserBookingsPage() {
  const { data: bookings, isLoading, error } = useUserBookings()
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking()

  const handleCancelBooking = (booking: BookingWithDetails) => {
    cancelBooking(
      { email: booking.user_email, bookingId: booking.booking_id },
      {
        onError: (error) => {
          // Display error message to user
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to cancel booking'
          alert(errorMessage)
        },
      },
    )
  }

  const canCancelBooking = (bookingDate: string): boolean => {
    const bookingTime = new Date(bookingDate).getTime()
    const currentTime = new Date().getTime()
    const hoursSinceBooking = (currentTime - bookingTime) / (1000 * 60 * 60)
    return hoursSinceBooking <= 6
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="mt-1 text-slate-400">
            View and manage your movie bookings
          </p>
        </div>
        <div className="text-center text-slate-400">
          Loading your bookings...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="mt-1 text-slate-400">
            View and manage your movie bookings
          </p>
        </div>
        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="py-8 text-center text-red-400">
            Failed to load bookings. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  const upcomingBookings =
    bookings?.filter(
      (b) =>
        b.status === 'confirmed' &&
        b.showtime &&
        new Date(b.showtime.start_time).getTime() > new Date().getTime(),
    ) || []

  const pastBookings =
    bookings?.filter(
      (b) =>
        b.status === 'cancelled' ||
        (b.showtime &&
          new Date(b.showtime.start_time).getTime() <= new Date().getTime()),
    ) || []

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
                key={booking.booking_id}
                className="border-slate-700/50 bg-slate-800/50"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-white">
                      {booking.movie?.title || 'Unknown Movie'}
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
                      {booking.room?.name || 'Unknown Room'}
                    </span>
                    {booking.showtime && (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            booking.showtime.start_time,
                          ).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(
                            booking.showtime.start_time,
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-slate-500">Seats: </span>
                      <span className="text-sm font-medium text-white">
                        {booking.seats.join(', ')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-amber-500">
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>
                  {canCancelBooking(booking.booking_date) ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            This action cannot be undone. This will permanently
                            cancel your booking for {booking.movie?.title}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                            Go Back
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelBooking(booking)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Cancellation period expired (6hrs after booking)
                    </p>
                  )}
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
                key={booking.booking_id}
                className="border-slate-700/50 bg-slate-800/30 opacity-70"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-slate-300">
                      {booking.movie?.title || 'Unknown Movie'}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-slate-700 text-slate-400"
                    >
                      {booking.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Completed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    {booking.showtime && (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            booking.showtime.start_time,
                          ).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(
                            booking.showtime.start_time,
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
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
