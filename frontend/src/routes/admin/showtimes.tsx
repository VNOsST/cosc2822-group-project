import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteShowtime, useShowtimes } from '@/hooks/use-showtimes-api'
import { CreateShowtimeDialog } from '@/components/showtimes/create-showtime-dialog'
import { CreateBulkShowtimesDialog } from '@/components/showtimes/create-bulk-showtimes-dialog'
import { EditShowtimeDialog } from '@/components/showtimes/edit-showtime-dialog'
import { useState } from 'react'

export const Route = createFileRoute('/admin/showtimes')({
  component: ShowtimesPage,
})

function ShowtimesPage() {
  const { data: showtimes, isLoading } = useShowtimes()
  const deleteShowtime = useDeleteShowtime()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showtimeToDelete, setShowtimeToDelete] = useState<{
    movieId: string
    startTime: string
    title: string
  } | null>(null)

  const handleDeleteClick = (
    movieId: string,
    startTime: string,
    title: string,
  ) => {
    setShowtimeToDelete({ movieId, startTime, title })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!showtimeToDelete) return

    try {
      await deleteShowtime.mutateAsync({
        movieId: showtimeToDelete.movieId,
        startTime: showtimeToDelete.startTime,
      })
      toast.success('Showtime deleted successfully')
      setDeleteDialogOpen(false)
      setShowtimeToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete showtime')
    }
  }

  // Calculate available seats
  const getAvailableSeats = (showtime: any) => {
    if (!showtime.room) return 0
    const totalSeats = showtime.room.capacity
    const occupiedSeats = showtime.occupied_seats?.length || 0
    return totalSeats - occupiedSeats
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Showtimes</h2>
          <p className="text-muted-foreground">
            Schedule screenings with conflict prevention.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateBulkShowtimesDialog />
          <CreateShowtimeDialog />
        </div>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-center gap-3 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm">
            <span className="font-medium">Conflict Prevention:</span> The system
            automatically validates scheduling to prevent double-booking of
            rooms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Showtimes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !showtimes || showtimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No showtimes scheduled
              </p>
              <p className="text-sm text-muted-foreground">
                Create your first showtime to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movie</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showtimes.map((showtime) => {
                    const startDate = new Date(showtime.start_time)
                    const endDate = new Date(showtime.endtime)
                    const availableSeats = getAvailableSeats(showtime)
                    const totalSeats = showtime.room?.capacity || 0
                    const occupancyRate =
                      totalSeats > 0
                        ? (totalSeats - availableSeats) / totalSeats
                        : 0

                    return (
                      <TableRow key={showtime.showtime_id}>
                        <TableCell className="font-medium">
                          {showtime.movie?.title || 'Unknown Movie'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {showtime.room?.name || 'Unknown Room'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(startDate, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(startDate, 'HH:mm')} -{' '}
                          {format(endDate, 'HH:mm')}
                        </TableCell>
                        <TableCell>${showtime.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              occupancyRate > 0.8
                                ? 'text-red-500'
                                : occupancyRate > 0.5
                                  ? 'text-amber-500'
                                  : 'text-green-500'
                            }
                          >
                            {availableSeats} / {totalSeats} seats
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditShowtimeDialog showtime={showtime} />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteClick(
                                  showtime.movie_id,
                                  showtime.start_time,
                                  showtime.movie?.title || 'Unknown Movie',
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Showtime</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the showtime for{' '}
              <strong>{showtimeToDelete?.title}</strong>? This action cannot be
              undone.
              {deleteShowtime.isPending && ' Deleting...'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteShowtime.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteShowtime.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteShowtime.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
