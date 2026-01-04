import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMovies } from '@/hooks/use-movies-api'
import type { Movie } from '@/lib/api-types'
import { MovieDialog } from '@/components/admin/movie-dialog'
import { DeleteMovieDialog } from '@/components/admin/delete-movie-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RemoteImage } from '@/components/ui/remote-image'

export const Route = createFileRoute('/admin/movies')({
  component: MoviesPage,
})

function MoviesPage() {
  const { data: movies, isLoading, error } = useMovies()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | undefined>(
    undefined,
  )

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
          <h2 className="text-3xl font-bold tracking-tight">Movies</h2>
          <p className="text-muted-foreground">
            Manage your movie library synced with the database.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Movie
        </Button>
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
