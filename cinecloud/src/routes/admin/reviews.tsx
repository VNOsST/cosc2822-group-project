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
import { movies, reviews } from '@/data/dummy-data'

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
})

function ReviewsPage() {
  const [showSpamOnly, setShowSpamOnly] = useState(false)

  const filteredReviews = showSpamOnly
    ? reviews.filter((r) => r.isSpam)
    : reviews

  const handleRemove = (id: string) => {
    toast.success(`Review ${id} removed successfully`)
  }

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
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legitimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {reviews.filter((r) => !r.isSpam).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spam Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {reviews.filter((r) => r.isSpam).length}
            </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Movie</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="max-w-[300px]">Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => {
                const movie = movies.find((m) => m.id === review.movieId)

                return (
                  <TableRow
                    key={review.id}
                    className={review.isSpam ? 'bg-red-500/5' : ''}
                  >
                    <TableCell className="font-medium">
                      {review.customerName}
                    </TableCell>
                    <TableCell>{movie?.title || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="line-clamp-2 text-sm">{review.comment}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {review.isSpam ? (
                        <Badge variant="destructive">Spam</Badge>
                      ) : (
                        <Badge variant="outline">Clean</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this review? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(review.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
