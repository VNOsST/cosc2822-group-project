import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { movies } from '@/data/dummy-data'

export const Route = createFileRoute('/_authenticated/movies')({
  component: MoviesPage,
})

function MoviesPage() {
  const handleEdit = (id: string) => {
    toast.info(`Edit movie ${id} - Feature coming soon`)
  }

  const handleDelete = (id: string) => {
    toast.info(`Delete movie ${id} - Feature coming soon`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Movies</h2>
          <p className="text-muted-foreground">
            Manage your movie library with manual entry or synced data.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Movie
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {movies.map((movie) => (
          <Card key={movie.id} className="overflow-hidden">
            <div className="aspect-[2/3] bg-gradient-to-br from-slate-800 to-slate-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant={movie.isNowShowing ? 'default' : 'secondary'}>
                  {movie.isNowShowing ? 'Now Showing' : 'Coming Soon'}
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="line-clamp-1 text-lg">
                {movie.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {movie.genre.slice(0, 2).map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{movie.duration} min</span>
                <span>{movie.rating}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Dir: {movie.director}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(movie.id)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(movie.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
