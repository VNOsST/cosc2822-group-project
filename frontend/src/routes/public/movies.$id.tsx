import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, Film, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { ErrorState } from "@/components/error-state";
import { MovieRatingDisplay } from "@/components/movie-rating-display";
import { ReviewsSection } from "@/components/reviews-section";
import { serverApiClient } from "@/lib/server-api-client";
import type { Movie, Showtime } from "@/lib/api-types";

export const Route = createFileRoute("/public/movies/$id")({
    ssr: "data-only",
    // Server-side data loading
    loader: async ({ params }) => {
        try {
            const [movie, showtimes] = await Promise.all([
                serverApiClient.get<Movie>(`/movies/${params.id}`),
                serverApiClient.get<Array<Showtime>>(
                    `/movies/${params.id}/showtimes`
                ),
            ]);
            return { movie, showtimes, error: null };
        } catch (error) {
            console.error("Failed to load movie details on server:", error);
            return {
                movie: null,
                showtimes: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load movie details",
            };
        }
    },
    component: MovieDetailPage,
});

function MovieDetailPage() {
    const navigate = useNavigate();
    const { movie, showtimes, error } = Route.useLoaderData();

    // Show error state if movie failed to load
    if (error || !movie) {
        return (
            <div className="space-y-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate({ to: "/public/movies" })}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Movies
                </Button>
                <ErrorState
                    title="Failed to Load Movie"
                    message={error || "Movie not found"}
                    actionLabel="Back to Movies"
                    onAction={() => navigate({ to: "/public/movies" })}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate({ to: "/public/movies" })}
                className="text-slate-400 hover:text-white"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Movies
            </Button>

            {/* Hero Section */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Poster */}
                <div className="lg:col-span-1">
                    <div className="relative overflow-hidden rounded-lg">
                        <RemoteImage
                            src={movie.poster_url}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
                        <MovieRatingDisplay
                            movie={movie}
                            className="absolute right-4 top-4"
                            size="md"
                        />
                    </div>
                </div>

                {/* Movie Info */}
                <div className="space-y-6 lg:col-span-2">
                    <div>
                        <h1 className="mb-2 text-4xl font-bold text-white">
                            {movie.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {movie.genres.map((genre) => (
                                <Badge
                                    key={genre}
                                    variant="outline"
                                    className="border-amber-500/50 text-amber-400"
                                >
                                    {genre}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                            <Clock className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="text-xs text-slate-400">
                                    Runtime
                                </p>
                                <p className="font-semibold text-white">
                                    {movie.runtime} min
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                            <Calendar className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="text-xs text-slate-400">
                                    Release Date
                                </p>
                                <p className="font-semibold text-white">
                                    {new Date(
                                        movie.release_date
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                            <p className="text-xs text-slate-400">CineScore</p>
                            <MovieRatingDisplay
                                movie={movie}
                                size="lg"
                                showLabel
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="mb-2 text-xl font-semibold text-white">
                            Synopsis
                        </h2>
                        <p className="leading-relaxed text-slate-300">
                            {movie.synopsis}
                        </p>
                    </div>

                    {movie.cast && movie.cast.length > 0 && (
                        <div>
                            <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-white">
                                <Users className="h-5 w-5" />
                                Cast
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {movie.cast.slice(0, 10).map((actor, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-slate-700 text-slate-300"
                                    >
                                        {actor}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery */}
            {movie.image_urls && movie.image_urls.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">
                        Gallery
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {movie.image_urls.slice(0, 6).map((url, index) => (
                            <div
                                key={index}
                                className="overflow-hidden rounded-lg border border-slate-700/50"
                            >
                                <RemoteImage
                                    src={url}
                                    alt={`${movie.title} - Image ${index + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Showtimes */}
            <div id="showtimes" className="space-y-4 scroll-mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                        <Film className="h-6 w-6 text-amber-500" />
                        Available Showtimes
                    </h2>
                </div>

                {showtimes && showtimes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {showtimes.map((showtime) => (
                            <Card
                                key={showtime.showtime_id}
                                className="border-slate-700/50 bg-slate-800/50 transition-colors hover:border-amber-500/30"
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-white">
                                        {new Date(
                                            showtime.start_time
                                        ).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Clock className="h-4 w-4" />
                                            {new Date(
                                                showtime.start_time
                                            ).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-slate-700 text-slate-300"
                                        >
                                            ${showtime.price.toFixed(2)}
                                        </Badge>
                                    </div>
                                    <Link
                                        to="/public/showtimes/$id"
                                        params={{ id: showtime.showtime_id }}
                                    >
                                        <Button
                                            size="sm"
                                            className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                                        >
                                            Book Now
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-slate-700/50 bg-slate-800/50">
                        <CardContent className="py-8 text-center">
                            <p className="text-slate-400">
                                No showtimes available for this movie at the
                                moment
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <hr className="border-slate-800" />

            {/* Reviews Section */}
            <ReviewsSection movieId={movie.id} />
        </div>
    );
}
