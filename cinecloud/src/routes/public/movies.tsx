import { Link, createFileRoute } from '@tanstack/react-router'
import { Star, Clock, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Mock data for movies
const MOCK_MOVIES = [
  {
    id: '1',
    title: 'Dune: Part Two',
    genre: 'Sci-Fi',
    duration: 166,
    rating: 8.8,
    posterUrl: 'https://picsum.photos/seed/dune/300/450',
    releaseDate: '2024-03-01',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
  },
  {
    id: '2',
    title: 'Oppenheimer',
    genre: 'Drama',
    duration: 180,
    rating: 8.5,
    posterUrl: 'https://picsum.photos/seed/oppen/300/450',
    releaseDate: '2023-07-21',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
  },
  {
    id: '3',
    title: 'The Batman',
    genre: 'Action',
    duration: 176,
    rating: 7.8,
    posterUrl: 'https://picsum.photos/seed/batman/300/450',
    releaseDate: '2022-03-04',
    description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate.',
  },
  {
    id: '4',
    title: 'Interstellar',
    genre: 'Sci-Fi',
    duration: 169,
    rating: 8.7,
    posterUrl: 'https://picsum.photos/seed/inter/300/450',
    releaseDate: '2014-11-07',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
  },
  {
    id: '5',
    title: 'The Grand Budapest Hotel',
    genre: 'Comedy',
    duration: 99,
    rating: 8.1,
    posterUrl: 'https://picsum.photos/seed/budapest/300/450',
    releaseDate: '2014-03-28',
    description: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years.',
  },
  {
    id: '6',
    title: 'Parasite',
    genre: 'Thriller',
    duration: 132,
    rating: 8.5,
    posterUrl: 'https://picsum.photos/seed/parasite/300/450',
    releaseDate: '2019-05-30',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
  },
]

export const Route = createFileRoute('/public/movies')({
  component: PublicMoviesPage,
})

function PublicMoviesPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Now Showing
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Discover the latest blockbusters and book your seats today
        </p>
      </div>

      {/* Movies Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOCK_MOVIES.map((movie) => (
          <Card
            key={movie.id}
            className="group overflow-hidden border-slate-700/50 bg-slate-800/50 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <Badge className="absolute right-2 top-2 bg-amber-500 text-slate-900">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {movie.rating}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-white">
                {movie.title}
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {movie.genre}
                </Badge>
                <span className="flex items-center text-xs text-slate-500">
                  <Clock className="mr-1 h-3 w-3" />
                  {movie.duration} min
                </span>
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                {movie.description}
              </p>
              <div className="flex gap-2">
                <Link to="/showtimes" className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                  >
                    Book Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
