import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, MapPin, User, Mail, CreditCard, Armchair, Phone } from 'lucide-react'
import type { BookingWithDetails } from '@/lib/api-types'

interface BookingDetailsDialogProps {
  booking: BookingWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) {
  if (!booking) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Booking Details</DialogTitle>
          <DialogDescription>
            Booking ID: {booking.booking_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Status
            </span>
            <Badge variant={getStatusVariant(booking.status)}>
              {booking.status.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            {booking.user ? (
              <div className="grid gap-3">
                {/* Profile Image and Name */}
                <div className="flex items-center gap-3">
                  {booking.user.profile_image_url && (
                    <img
                      src={booking.user.profile_image_url}
                      alt={booking.user.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">
                        {booking.user.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {booking.user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {booking.user.id}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user.email}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user.phone}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user_email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Movie Information */}
          {booking.movie && (
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Movie Information</h3>
                <div className="flex gap-4">
                  {booking.movie.poster_url && (
                    <img
                      src={booking.movie.poster_url}
                      alt={booking.movie.title}
                      className="w-24 h-36 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-lg">
                      {booking.movie.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.movie.genres?.map((genre) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Runtime: {booking.movie.runtime} minutes
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Showtime Information */}
          {booking.showtime && (
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Showtime Information</h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(booking.showtime.start_time),
                          'EEEE, MMMM d, yyyy',
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.showtime.start_time), 'h:mm a')}{' '}
                        - {format(new Date(booking.showtime.endtime), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  {booking.room && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Room</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.room.name} ({booking.room.screen_type})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Seat Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Armchair className="h-5 w-5" />
              Seats
            </h3>
            <div className="flex flex-wrap gap-2">
              {booking.seats.map((seat) => (
                <Badge key={seat} variant="outline" className="text-base px-3 py-1">
                  {seat}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h3>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Number of Seats
                </span>
                <span className="text-sm font-medium">{booking.seats.length}</span>
              </div>
              {booking.showtime && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Price per Seat
                  </span>
                  <span className="text-sm font-medium">
                    {booking.showtime.price.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total Amount</span>
                <span className="font-semibold text-lg">
                  {booking.total_amount.toLocaleString('vi-VN')} VND
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Date */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booked on</span>
            <span className="font-medium">
              {format(new Date(booking.booking_date), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
