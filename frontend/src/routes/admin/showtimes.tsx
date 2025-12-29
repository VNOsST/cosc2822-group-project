import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { movies, rooms, showtimes } from '@/data/dummy-data'

export const Route = createFileRoute('/admin/showtimes')({
  component: ShowtimesPage,
})

function ShowtimesPage() {
  const handleEdit = (id: string) => {
    toast.info(`Edit showtime ${id} - Feature coming soon`)
  }

  const handleDelete = (id: string) => {
    toast.info(`Delete showtime ${id} - Feature coming soon`)
  }

  const handleBulkCreate = () => {
    toast.info('Bulk schedule creation - Feature coming soon')
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
          <Button variant="outline" onClick={handleBulkCreate}>
            <Copy className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Showtime
          </Button>
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
                const movie = movies.find((m) => m.id === showtime.movieId)
                const room = rooms.find((r) => r.id === showtime.roomId)
                const startDate = new Date(showtime.startTime)
                const endDate = new Date(showtime.endTime)

                return (
                  <TableRow key={showtime.id}>
                    <TableCell className="font-medium">
                      {movie?.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{room?.name}</Badge>
                    </TableCell>
                    <TableCell>{format(startDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                    </TableCell>
                    <TableCell>${showtime.price}</TableCell>
                    <TableCell>
                      <span
                        className={
                          showtime.availableSeats < 50
                            ? 'text-red-500'
                            : showtime.availableSeats < 100
                              ? 'text-amber-500'
                              : 'text-green-500'
                        }
                      >
                        {showtime.availableSeats} seats
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(showtime.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(showtime.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
