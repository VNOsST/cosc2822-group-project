import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Clock, Info, MapPin, Ticket } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCancelBooking, useUserBookings } from '@/hooks/use-bookings-api'
import { formatCurrency } from '@/lib/utils'
import type { BookingWithDetails } from '@/lib/api-types'

export const Route = createFileRoute('/user/bookings')({
  component: UserBookingsPage,
})

function UserBookingsPage() {
  const { data: bookings, isLoading, error } = useUserBookings()
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking()
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(
    null,
  )

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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg text-white">
                        {booking.movie?.title || 'Unknown Movie'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg text-slate-300">
                        {booking.movie?.title || 'Unknown Movie'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-white"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
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

      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="max-w-2xl border-slate-700 bg-slate-900 text-white">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Booking Details
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Reference: {selectedBooking.booking_id}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Movie Info */}
                <div className="space-y-4">
                  <div className="aspect-[2/3] overflow-hidden rounded-lg bg-slate-800">
                    {selectedBooking.movie?.poster_url ? (
                      <img
                        src={selectedBooking.movie.poster_url}
                        alt={selectedBooking.movie.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-600">
                        No Poster
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedBooking.movie?.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 line-clamp-3">
                      {selectedBooking.movie?.synopsis}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedBooking.movie?.genres.map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className="border-slate-700 text-slate-400"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Showtime & Venue
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        <span>
                          {selectedBooking.room?.name} (
                          {selectedBooking.room?.screen_type})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <span>
                          {selectedBooking.showtime &&
                            new Date(
                              selectedBooking.showtime.start_time,
                            ).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>
                          {selectedBooking.showtime &&
                            new Date(
                              selectedBooking.showtime.start_time,
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          {' - '}
                          {selectedBooking.showtime &&
                            new Date(
                              selectedBooking.showtime.endtime,
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Seats & Payment
                    </h4>
                    <div className="space-y-3 rounded-lg bg-slate-800/50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Seats</span>
                        <span className="font-medium text-white">
                          {selectedBooking.seats.join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Status</span>
                        <Badge
                          className={
                            selectedBooking.status === 'confirmed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        >
                          {selectedBooking.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-3">
                        <span className="text-base font-semibold">
                          Total Amount
                        </span>
                        <span className="text-xl font-bold text-amber-500">
                          {formatCurrency(selectedBooking.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs italic text-slate-500">
                    Booked on{' '}
                    {new Date(selectedBooking.booking_date).toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
