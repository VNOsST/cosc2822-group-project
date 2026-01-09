import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useMovies,
  useStartSyncJob,
  useSyncJobStatus,
} from '@/hooks/use-movies-api'
import { useInvalidateQueries } from '@/hooks/use-api'
import type { Movie, SyncJobResponse } from '@/lib/api-types'
import { MovieDialog } from '@/components/admin/movie-dialog'
import { DeleteMovieDialog } from '@/components/admin/delete-movie-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RemoteImage } from '@/components/ui/remote-image'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/movies')({
  component: MoviesPage,
})

function MoviesPage() {
  const { data: movies, isLoading, error } = useMovies()
  const { mutate: startSync, isPending: isStartingSync } = useStartSyncJob()
  const { invalidate } = useInvalidateQueries()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | undefined>(
    undefined,
  )

  // Poll for job status while sync is in progress
  const { data: jobStatus, error: syncError } = useSyncJobStatus(
    activeJobId,
    !!activeJobId,
  )

  // Handle job status changes (completion, failure, or tracking errors)
  useEffect(() => {
    if (!activeJobId) return

    if (syncError) {
      toast.error(`Error tracking sync status: ${syncError.message}`)
      setActiveJobId(null)
      return
    }

    if (!jobStatus) return

    if (jobStatus.status === 'completed') {
      const result = jobStatus.result
      if (result) {
        const message = result.errorCount > 0
          ? `Synced ${result.newMoviesCreated} new movies and updated ${result.ratingsUpdated} ratings, but encountered ${result.errorCount} errors.`
          : `Successfully synced ${result.newMoviesCreated} new movies and updated ${result.ratingsUpdated} ratings${result.duration ? ` in ${result.duration}` : ''}.`
        
        result.errorCount > 0 ? toast.warning(message) : toast.success(message)
      }
      
      invalidate(['movies'])
      setActiveJobId(null)
    } else if (jobStatus.status === 'failed') {
      toast.error(jobStatus.result?.errors?.[0] || 'Sync failed')
      setActiveJobId(null)
    }
  }, [jobStatus, syncError, activeJobId, invalidate])

  const handleEdit = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsEditOpen(true)
  }

  const handleDelete = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsDeleteOpen(true)
  }

  const handleAdd = () => {
    setSelectedMovie(undefined)
    setIsAddOpen(true)
  }

  const handleSync = () => {
    startSync(undefined, {
      onSuccess: (data: SyncJobResponse) => {
        setActiveJobId(data.job_id)

        // Show appropriate toast based on job status
        if (data.status === 'queued') {
          toast.info(data.message || 'Sync job started. This may take a moment...')
        } else if (data.message?.includes('already')) {
          // Job already in progress
          toast.info(data.message)
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to start sync')
      },
    })
  }

  // Get sync status indicator
  const getSyncStatusBadge = () => {
    if (!activeJobId || !jobStatus) return null

    switch (jobStatus.status) {
      case 'queued':
        return (
          <Badge variant="secondary" className="ml-2">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Queued
          </Badge>
        )
      case 'running':
        return (
          <Badge variant="default" className="ml-2 bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Syncing...
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="ml-2 bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Complete
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="ml-2">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load movies. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Movies
            {getSyncStatusBadge()}
          </h2>
          <p className="text-muted-foreground">
            Manage your movie library synced with the database.
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleSync}
                    disabled={isStartingSync || !!activeJobId}
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    {isStartingSync ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Movies
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {activeJobId && (
                <TooltipContent>
                  <p>A sync job is currently in progress</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Movie
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {movies?.map((movie) => {
          const isReleased = new Date(movie.release_date) <= new Date()

          return (
            <Card key={movie.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[2/3] bg-gradient-to-br from-slate-800 to-slate-900 relative">
                <RemoteImage
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  fallback={<span className="text-4xl">🎬</span>}
                />

                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={isReleased ? 'default' : 'secondary'}>
                    {isReleased ? 'Now Showing' : 'Coming Soon'}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-lg" title={movie.title}>
                  {movie.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-1">
                  {movie.genres?.slice(0, 2).map((g) => (
                    <Badge key={g} variant="outline" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                  {(movie.genres?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{(movie.genres?.length || 0) - 2}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{movie.runtime} min</span>
                  <span>⭐ {movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>

                <div className="flex-1"></div>

                <div className="flex gap-2 pt-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(movie)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(movie)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {movies?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No movies found. Click "Add Movie" to get started.
          </div>
        )}
      </div>

      <MovieDialog open={isAddOpen} onOpenChange={setIsAddOpen} mode="create" />

      <MovieDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        movie={selectedMovie}
        mode="edit"
      />

      <DeleteMovieDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        movie={selectedMovie || null}
      />
    </div>
  )
}
