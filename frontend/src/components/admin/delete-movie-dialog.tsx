import { toast } from 'sonner'
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
import { useDeleteMovie } from '@/hooks/use-movies-api'
import type { Movie } from '@/lib/api-types'

interface DeleteMovieDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movie: Movie | null
}

export function DeleteMovieDialog({
  open,
  onOpenChange,
  movie,
}: DeleteMovieDialogProps) {
  const deleteMovie = useDeleteMovie()

  const handleDelete = async () => {
    if (!movie) return

    try {
      await deleteMovie.mutateAsync(movie.id)
      toast.success('Movie deleted successfully')
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || 'Failed to delete movie'
      toast.error(errorMessage)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{movie?.title}</strong>. This
            action cannot be undone.
            {movie && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Movie Details:</div>
                <div>Runtime: {movie.runtime} minutes</div>
                <div>Release Date: {movie.release_date}</div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMovie.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMovie.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleteMovie.isPending ? 'Deleting...' : 'Delete Movie'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
