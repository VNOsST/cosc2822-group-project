import { createFileRoute } from '@tanstack/react-router'
import { Star, Film, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Mock reviews data
const MOCK_REVIEWS = [
  {
    id: '1',
    movieTitle: 'Dune: Part Two',
    rating: 5,
    comment: 'Absolutely stunning! The visuals and Hans Zimmer\'s score create an immersive experience like no other.',
    createdAt: '2024-12-20',
  },
  {
    id: '2',
    movieTitle: 'Oppenheimer',
    rating: 4,
    comment: 'Brilliant acting and direction. A bit long but worth every minute.',
    createdAt: '2024-12-15',
  },
  {
    id: '3',
    movieTitle: 'The Batman',
    rating: 4,
    comment: 'Dark and gritty take on Batman. Robert Pattinson was excellent.',
    createdAt: '2024-12-10',
  },
]

export const Route = createFileRoute('/user/reviews')({
  component: UserReviewsPage,
})

function UserReviewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Reviews</h1>
        <p className="mt-1 text-slate-400">Manage your movie reviews</p>
      </div>

      <div className="space-y-4">
        {MOCK_REVIEWS.length === 0 ? (
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="py-8 text-center text-slate-400">
              You haven't written any reviews yet. Watch a movie and share your thoughts!
            </CardContent>
          </Card>
        ) : (
          MOCK_REVIEWS.map((review) => (
            <Card
              key={review.id}
              className="border-slate-700/50 bg-slate-800/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Film className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg text-white">
                      {review.movieTitle}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-slate-300">{review.comment}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
