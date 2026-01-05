import { MessageSquare, Star, User as UserIcon } from 'lucide-react'
import { useMovieRatings } from '@/hooks/use-ratings-api'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RemoteImage } from '@/components/ui/remote-image'

interface ReviewsSectionProps {
  movieId: string
}

export function ReviewsSection({ movieId }: ReviewsSectionProps) {
  const { data: ratings, isLoading } = useMovieRatings(movieId)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-semibold text-white">User Reviews</h2>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : ratings && ratings.length > 0 ? (
          ratings
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .map((rating) => (
              <Card
                key={rating.id}
                className="border-slate-700/30 bg-slate-800/40"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 border border-slate-700">
                        <AvatarFallback className="bg-slate-700 text-slate-300">
                          <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">
                              {rating.user?.name || 'Unknown User'}
                            </span>
                            <div className="flex items-center text-amber-500">
                              <Star className="mr-1 h-3 w-3 fill-current" />
                              <span className="text-sm font-bold">
                                {rating.rating}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-0.5">
                                /10
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(rating.created_at).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              },
                            )}
                          </span>
                        </div>
                        {rating.review && (
                          <p className="text-slate-300 leading-relaxed italic">
                            "{rating.review}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Review Images */}
                    {rating.image_keys && rating.image_keys.length > 0 && (
                      <div className="ml-14 flex flex-wrap gap-2">
                        {rating.image_keys.map((imageKey, index) => (
                          <div
                            key={index}
                            className="h-20 w-20 overflow-hidden rounded-md border border-slate-700"
                          >
                            <RemoteImage
                              src={imageKey}
                              alt={`Review image ${index + 1}`}
                              className="h-full w-full object-cover transition-transform hover:scale-110"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <div className="py-12 text-center text-slate-500">
            <p>No reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
