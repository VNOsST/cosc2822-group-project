import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Film,
  Pencil,
} from "lucide-react";
import { addMinutes, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMovies } from '@/hooks/use-movies-api'
import { useRooms } from '@/hooks/use-rooms-api'
import { useUpdateShowtime } from '@/hooks/use-showtimes-api'
import type { ShowtimeWithDetails } from '@/lib/api-types'

interface EditShowtimeDialogProps {
  showtime: ShowtimeWithDetails
  trigger?: React.ReactNode
}

export function EditShowtimeDialog({
  showtime,
  trigger,
}: EditShowtimeDialogProps) {
  const [open, setOpen] = useState(false)

  // Parse the existing start_time to get date and time
  const existingStartTime = new Date(showtime.start_time)
  const initialDate = format(existingStartTime, 'yyyy-MM-dd')
  const initialTime = format(existingStartTime, 'HH:mm')

  const [formData, setFormData] = useState({
    movie_id: showtime.movie_id,
    room_id: showtime.room_id,
    date: initialDate,
    time: initialTime,
    price: showtime.price.toString(),
  })

  const { data: movies, isLoading: moviesLoading } = useMovies()
  const { data: rooms, isLoading: roomsLoading } = useRooms()
  const updateShowtime = useUpdateShowtime()

  // Calculate end time based on movie runtime
  const selectedMovie = movies?.find((m) => m.id === formData.movie_id)
  const endTime =
    selectedMovie && formData.date && formData.time
      ? format(
          addMinutes(
            new Date(`${formData.date}T${formData.time}`),
            selectedMovie.runtime,
          ),
          'HH:mm',
        )
      : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.movie_id ||
      !formData.room_id ||
      !formData.date ||
      !formData.time ||
      !formData.price
    ) {
      toast.error('Please fill in all fields')
      return
    }

    // Create ISO timestamp from date and time inputs
    const startDateTime = new Date(
      `${formData.date}T${formData.time}:00`,
    ).toISOString()

    try {
      await updateShowtime.mutateAsync({
        movieId: showtime.movie_id,
        startTime: showtime.start_time,
        movie_id: formData.movie_id,
        room_id: formData.room_id,
        start_time: startDateTime,
        price: parseFloat(formData.price),
      })

      toast.success('Showtime updated successfully')
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update showtime')
    }
  }

  // Reset form when dialog opens with showtime data
  useEffect(() => {
    if (open) {
      const existingStartTime = new Date(showtime.start_time)
      setFormData({
        movie_id: showtime.movie_id,
        room_id: showtime.room_id,
        date: format(existingStartTime, 'yyyy-MM-dd'),
        time: format(existingStartTime, 'HH:mm'),
        price: showtime.price.toString(),
      })
    }
  }, [open, showtime])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Showtime</DialogTitle>
          <DialogDescription>
            Update the screening details for {showtime.movie?.title}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Movie Selection */}
            <div className="space-y-2">
              <Label htmlFor="movie" className="flex items-center gap-2">
                <Film className="h-4 w-4 text-amber-500" />
                Movie
              </Label>
              <Select
                value={formData.movie_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, movie_id: value }))
                }
                disabled={moviesLoading}
              >
                <SelectTrigger id="movie">
                  <SelectValue placeholder="Select a movie" />
                </SelectTrigger>
                <SelectContent>
                  {movies?.map((movie) => (
                    <SelectItem key={movie.id} value={movie.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{movie.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {movie.runtime} mins
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                Room
              </Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, room_id: value }))
                }
                disabled={roomsLoading}
              >
                <SelectTrigger id="room">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {room.capacity} seats • {room.screen_type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Start Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" />
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>

            {/* End Time (Calculated) */}
            {endTime && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  End Time (Auto-calculated)
                </Label>
                <Input
                  type="text"
                  value={endTime}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </div>

          {/* Summary Box */}
          {formData.movie_id &&
            formData.room_id &&
            formData.date &&
            formData.time && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="mb-2 font-semibold text-amber-500">
                  Updated Screening Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Movie:</strong> {selectedMovie?.title}
                  </p>
                  <p>
                    <strong>Room:</strong>{' '}
                    {rooms?.find((r) => r.room_id === formData.room_id)?.name}
                  </p>
                  <p>
                    <strong>Date & Time:</strong>{' '}
                    {format(new Date(formData.date), 'MMM d, yyyy')} at{' '}
                    {formData.time}
                  </p>
                  {endTime && (
                    <p>
                      <strong>Duration:</strong> {selectedMovie?.runtime} mins
                      (ends at {endTime})
                    </p>
                  )}
                </div>
              </div>
            )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateShowtime.isPending}
              className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {updateShowtime.isPending ? 'Updating...' : 'Update Showtime'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
