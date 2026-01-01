import { createFileRoute } from '@tanstack/react-router'
import { Eye, Search, Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { z } from 'zod'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAllBookings } from '@/hooks/use-bookings-api'
import { useMovies } from '@/hooks/use-movies-api'
import { BookingDetailsDialog } from '@/components/bookings/booking-details-dialog'
import type { BookingWithDetails } from '@/lib/api-types'
import { Skeleton } from '@/components/ui/skeleton'

const searchSchema = z.object({
  status: z.enum(['all', 'confirmed', 'pending', 'cancelled']).optional(),
})

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
  validateSearch: searchSchema,
})

function BookingsPage() {
  // Filter states (pending - not yet applied)
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingStatus, setPendingStatus] = useState<string>('all')
  const [pendingMovie, setPendingMovie] = useState<string>('all')
  const [pendingDate, setPendingDate] = useState<Date | undefined>()

  // Applied filter states (sent to API)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<string>('all')
  const [appliedMovie, setAppliedMovie] = useState<string>('all')
  const [appliedDate, setAppliedDate] = useState<Date | undefined>()

  // Debounced search value (500ms delay)
  // useDebouncedValue returns [debouncedValue, debouncerInstance]
  const [debouncedSearch] = useDebouncedValue(appliedSearch, { wait: 500 })

  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch bookings with applied filters
  const { data: bookings, isLoading: isLoadingBookings } = useAllBookings({
    status: appliedStatus !== 'all' ? appliedStatus : undefined,
    movie_id: appliedMovie !== 'all' ? appliedMovie : undefined,
    date: appliedDate ? format(appliedDate, 'yyyy-MM-dd') : undefined,
    search: debouncedSearch || undefined,
  })

  // Fetch movies for filter dropdown
  const { data: movies } = useMovies()

  const handleApplyFilters = () => {
    setAppliedSearch(pendingSearch)
    setAppliedStatus(pendingStatus)
    setAppliedMovie(pendingMovie)
    setAppliedDate(pendingDate)
  }

  const handleClearFilters = () => {
    setPendingSearch('')
    setPendingStatus('all')
    setPendingMovie('all')
    setPendingDate(undefined)
    setAppliedSearch('')
    setAppliedStatus('all')
    setAppliedMovie('all')
    setAppliedDate(undefined)
  }

  const hasUnappliedChanges =
    pendingSearch !== appliedSearch ||
    pendingStatus !== appliedStatus ||
    pendingMovie !== appliedMovie ||
    pendingDate?.getTime() !== appliedDate?.getTime()

  const hasActiveFilters =
    appliedSearch !== '' ||
    appliedStatus !== 'all' ||
    appliedMovie !== 'all' ||
    appliedDate !== undefined

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
  }

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        <p className="text-muted-foreground">
          View and manage all bookings across your theaters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 lg:px-3"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email or user ID..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={pendingStatus} onValueChange={setPendingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Movie Filter */}
              <Select value={pendingMovie} onValueChange={setPendingMovie}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by movie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movies</SelectItem>
                  {(movies || []).map((movie) => (
                    <SelectItem key={movie.id} value={movie.id}>
                      {movie.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pendingDate ? (
                      format(pendingDate, 'MMM d, yyyy')
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={pendingDate}
                    onSelect={setPendingDate}
                  />
                  {pendingDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setPendingDate(undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApplyFilters}
                disabled={!hasUnappliedChanges}
                className="w-full sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
                {hasUnappliedChanges && (
                  <Badge variant="secondary" className="ml-2">
                    Pending
                  </Badge>
                )}
              </Button>
              {hasUnappliedChanges && (
                <p className="text-sm text-muted-foreground">
                  You have unapplied filter changes
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Bookings
            <Badge variant="secondary" className="ml-2">
              {bookings?.length || 0}
            </Badge>
            {isLoadingBookings && (
              <Badge variant="outline" className="ml-2">
                Loading...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No bookings found matching your filters.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Movie</TableHead>
                    <TableHead>Showtime</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booked On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.booking_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {booking.user?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {booking.movie?.title || 'Unknown'}
                          </p>
                          {booking.movie?.genres && (
                            <p className="text-xs text-muted-foreground truncate">
                              {booking.movie.genres.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.showtime ? (
                          <div>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(booking.showtime.start_time),
                                'MMM d',
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(booking.showtime.start_time),
                                'h:mm a',
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {booking.seats.slice(0, 3).map((seat) => (
                            <Badge
                              key={seat}
                              variant="outline"
                              className="text-xs"
                            >
                              {seat}
                            </Badge>
                          ))}
                          {booking.seats.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{booking.seats.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.total_amount.toLocaleString('vi-VN')} VND
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(
                              new Date(booking.booking_date),
                              'MMM d, yyyy',
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(booking.booking_date), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
