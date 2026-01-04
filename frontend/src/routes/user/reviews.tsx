import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Edit2, Film, Loader2, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { useCreateRating, useDeleteRating, useUpdateRating, useUserRatings } from '@/hooks/use-ratings-api'
import { useUserBookings } from '@/hooks/use-bookings-api'
import { useAuth } from '@/hooks/use-auth'
import { useImages } from '@/hooks/use-images-api'
import type { BookingWithDetails, MovieRating } from '@/lib/api-types'

// Extended type to include the movie details we added in the backend
interface RatingWithMovie extends MovieRating {
  movie: {
    title: string
    poster_url: string
  } | null
}

export const Route = createFileRoute('/user/reviews')({
  component: UserReviewsPage,
})

function UserReviewsPage() {
  const { user } = useAuth()
  const { data: ratings, isLoading: isLoadingRatings, error: ratingsError } = useUserRatings(user?.userId || '')
  const { data: bookings, isLoading: isLoadingBookings } = useUserBookings()
  
  const [editingRating, setEditingRating] = useState<RatingWithMovie | null>(null)
  const [deletingRating, setDeletingRating] = useState<RatingWithMovie | null>(null)
  const [isAddingReview, setIsAddingReview] = useState(false)

  const isLoading = isLoadingRatings || isLoadingBookings

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (ratingsError) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Error loading reviews. Please try again later.
      </div>
    )
  }

  const ratingsList = (ratings as unknown as Array<RatingWithMovie>) || []
  
  // Logic to determine which movies can be reviewed
  // 1. Must have a confirmed booking
  // 2. Must not have been reviewed already
  const confirmedBookings = (bookings as unknown as Array<BookingWithDetails>)?.filter(b => b.status === 'confirmed') || []
  const reviewedMovieIds = new Set(ratingsList.map(r => r.movie_id))
  
  // Use a map to get unique movies (user might have booked the same movie multiple times)
  const reviewableMoviesMap = new Map()
  confirmedBookings.forEach(booking => {
    if (booking.movie && !reviewedMovieIds.has(booking.movie_id)) {
      reviewableMoviesMap.set(booking.movie_id, booking.movie)
    }
  })
  
  const reviewableMovies = Array.from(reviewableMoviesMap.values())

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Reviews</h1>
          <p className="mt-1 text-slate-400">Manage your movie reviews</p>
        </div>
        <Button 
          onClick={() => setIsAddingReview(true)}
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          Write a Review
        </Button>
      </div>

      <div className="space-y-4">
        {ratingsList.length === 0 ? (
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="py-8 text-center text-slate-400">
              You haven't written any reviews yet. Watch a movie and share your
              thoughts!
            </CardContent>
          </Card>
        ) : (
          ratingsList.map((rating) => (
            <ReviewCard
              key={rating.id}
              rating={rating}
              onEdit={() => setEditingRating(rating)}
              onDelete={() => setDeletingRating(rating)}
            />
          ))
        )}
      </div>

      {editingRating && (
        <EditReviewDialog
          rating={editingRating}
          open={!!editingRating}
          onOpenChange={(open) => !open && setEditingRating(null)}
        />
      )}

      {deletingRating && (
        <DeleteReviewDialog
          rating={deletingRating}
          open={!!deletingRating}
          onOpenChange={(open) => !open && setDeletingRating(null)}
        />
      )}

      <AddReviewDialog 
        open={isAddingReview}
        onOpenChange={setIsAddingReview}
        reviewableMovies={reviewableMovies}
        userId={user?.userId || ''}
      />
    </div>
  )
}

function ReviewCard({
  rating,
  onEdit,
  onDelete,
}: {
  rating: RatingWithMovie
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: images } = useImages(rating.image_keys || [])
  const imageUrls = Object.values(images || {})

  return (
    <Card className="border-slate-700/50 bg-slate-800/50 transition-colors hover:bg-slate-800/80">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {rating.movie?.poster_url ? (
              <img 
                src={rating.movie.poster_url} 
                alt={rating.movie.title} 
                className="h-16 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-12 items-center justify-center rounded bg-slate-700">
                <Film className="h-6 w-6 text-slate-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg text-white">
                {rating.movie?.title || 'Unknown Movie'}
              </CardTitle>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating.rating
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  {rating.rating}/10
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Edit2 className="mr-2 h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          {new Date(rating.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap text-slate-300">{rating.review}</p>
        
        {imageUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-700">
                <img src={url} alt="Review attachment" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(10),
  review: z.string().min(1, 'Review cannot be empty'),
  image_keys: z.array(z.string()).optional(),
  movie_id: z.string().min(1, 'Please select a movie'),
})

function AddReviewDialog({
  open,
  onOpenChange,
  reviewableMovies,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewableMovies: Array<{ id: string; title: string }>
  userId: string
}) {
  const { mutate: createRating, isPending } = useCreateRating()
  const [hoverRating, setHoverRating] = useState(0)
  
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      review: '',
      image_keys: [],
      movie_id: '',
    },
  })

  // Reset form when dialog opens
  if (!open && form.formState.isDirty) {
    form.reset()
  }

  const onSubmit = (values: z.infer<typeof reviewSchema>) => {
    createRating(
      {
        user_id: userId,
        movie_id: values.movie_id,
        rating: values.rating,
        review: values.review,
        image_keys: values.image_keys,
      },
      {
        onSuccess: () => {
          toast.success('Review submitted successfully')
          form.reset()
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Failed to submit review')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-slate-700 bg-slate-900 text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        {reviewableMovies.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p>You don't have any movies to review.</p>
            <p className="mt-2 text-sm">
              You can only review movies you have booked and watched, and haven't reviewed yet.
            </p>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline" 
              className="mt-4 border-slate-600 text-slate-300"
            >
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="movie_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-100">
                          <SelectValue placeholder="Select a movie to review" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-slate-700 bg-slate-800 text-slate-100">
                        {reviewableMovies.map((movie) => (
                          <SelectItem key={movie.id} value={movie.id} className="focus:bg-slate-700 focus:text-slate-100">
                            {movie.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const starValue = i + 1
                          return (
                            <button
                              key={i}
                              type="button"
                              className="focus:outline-none"
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => field.onChange(starValue)}
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  starValue <= (hoverRating || field.value)
                                    ? 'fill-amber-500 text-amber-500'
                                    : 'text-slate-600'
                                }`}
                              />
                            </button>
                          )
                        })}
                        <span className="ml-2 text-sm font-medium text-slate-400">
                          {field.value}/10
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="review"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your review here..."
                        className="min-h-[100px] border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_keys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images (Optional)</FormLabel>
                    <FormControl>
                       <ReviewImagesEditor 
                          keys={field.value || []} 
                          onChange={field.onChange} 
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditReviewDialog({
  rating,
  open,
  onOpenChange,
}: {
  rating: RatingWithMovie
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: updateRating, isPending } = useUpdateRating()
  
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: rating.rating,
      review: rating.review || '',
      image_keys: rating.image_keys || [],
      movie_id: rating.movie_id, // Needed for schema validation, though hidden
    },
  })

  const onSubmit = (values: z.infer<typeof reviewSchema>) => {
    updateRating(
      {
        id: rating.id,
        rating: values.rating,
        review: values.review,
        image_keys: values.image_keys,
      },
      {
        onSuccess: () => {
          toast.success('Review updated successfully')
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Failed to update review')
        },
      }
    )
  }

  const [hoverRating, setHoverRating] = useState(0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-slate-700 bg-slate-900 text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Review: {rating.movie?.title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const starValue = i + 1
                        return (
                          <button
                            key={i}
                            type="button"
                            className="focus:outline-none"
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => field.onChange(starValue)}
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                starValue <= (hoverRating || field.value)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        )
                      })}
                      <span className="ml-2 text-sm font-medium text-slate-400">
                        {field.value}/10
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your review here..."
                      className="min-h-[100px] border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_keys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images (Optional)</FormLabel>
                  <FormControl>
                     <ReviewImagesEditor 
                        keys={field.value || []} 
                        onChange={field.onChange} 
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteReviewDialog({
  rating,
  open,
  onOpenChange,
}: {
  rating: RatingWithMovie
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: deleteRating, isPending } = useDeleteRating()

  const handleDelete = () => {
    deleteRating(rating.id, {
      onSuccess: () => {
        toast.success('Review deleted successfully')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Failed to delete review')
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-slate-700 bg-slate-900 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            This will permanently delete your review for <span className="text-white font-medium">{rating.movie?.title}</span>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete Review'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ReviewImagesEditor({ 
  keys, 
  onChange 
}: { 
  keys: Array<string>, 
  onChange: (keys: Array<string>) => void 
}) {
  const handleAdd = (newKey: string) => {
    onChange([...keys, newKey])
  }

  const handleRemove = (indexToRemove: number) => {
    onChange(keys.filter((_, index) => index !== indexToRemove))
  }

  const handleReplace = (indexToReplace: number, newKey: string) => {
    if (!newKey) {
        handleRemove(indexToReplace)
    } else {
        const newKeys = [...keys]
        newKeys[indexToReplace] = newKey
        onChange(newKeys)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {keys.map((key, index) => (
        <div key={key} className="relative">
          <ImageUpload
            folder="reviews"
            value={key}
            onChange={(val) => handleReplace(index, val)}
            aspectRatio="square"
            className="h-24 w-full"
          />
        </div>
      ))}
      
      {/* Show add button if fewer than 3 images */}
      {keys.length < 3 && (
         <ImageUpload
            folder="reviews"
            value=""
            onChange={handleAdd}
            aspectRatio="square"
            className="h-24 w-full"
          />
      )}
    </div>
  )
}
