import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useState } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAllRatings, useDeleteRating } from '@/hooks/use-ratings-api'
import { useMovies } from '@/hooks/use-movies-api'

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
})

function ReviewsPage() {
  const [showSpamOnly, setShowSpamOnly] = useState(false)
  const { data: ratings = [], isLoading, error } = useAllRatings()
  const { data: movies = [] } = useMovies()
  const { mutate: deleteRating, isPending: isDeleting } = useDeleteRating()

  const filteredReviews = showSpamOnly
    ? ratings.filter((r) => r.is_spam)
    : ratings

  const handleRemove = (id: string) => {
    deleteRating(id, {
      onSuccess: () => {
        toast.success('Review removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove review')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading reviews...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Failed to load reviews. Please try again.
        </div>
      </div>
    )
  }

  const spamCount = ratings.filter((r) => r.is_spam).length
  const cleanCount = ratings.filter((r) => !r.is_spam).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
          <p className="text-muted-foreground">
            Manage customer reviews and remove spam content.
          </p>
        </div>
        <Button
          variant={showSpamOnly ? 'default' : 'outline'}
          onClick={() => setShowSpamOnly(!showSpamOnly)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {showSpamOnly ? 'Showing Spam Only' : 'Show Spam Only'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legitimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {cleanCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spam Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{spamCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {showSpamOnly ? 'Spam Reviews' : 'All Reviews'}
            <Badge variant="secondary" className="ml-2">
              {filteredReviews.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showSpamOnly
                ? 'No spam reviews detected!'
                : 'No reviews yet. Encourage customers to leave reviews!'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Movie</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="max-w-[300px]">Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((rating) => {
                  const movie = movies.find((m) => m.id === rating.movie_id)

                  return (
                    <TableRow
                      key={rating.id}
                      className={rating.is_spam ? 'bg-red-500/5' : ''}
                    >
                      <TableCell className="font-medium font-mono text-xs">
                        {rating.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{movie?.title || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < rating.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm">
                            {rating.rating}/10
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {rating.review ? (
                          <p className="line-clamp-2 text-sm">
                            {rating.review}
                          </p>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No review text
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(rating.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {rating.is_spam ? (
                          <Badge variant="destructive">Spam</Badge>
                        ) : (
                          <Badge variant="outline">Clean</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this review?
                                This action cannot be undone and will
                                recalculate the movie's average rating.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemove(rating.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
