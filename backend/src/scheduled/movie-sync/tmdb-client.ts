/**
 * TMDB (The Movie Database) API Client
 * Handles fetching movie data from TMDB API
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// TMDB API response types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  vote_average: number;
  popularity: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      order: number;
    }>;
  };
  images?: {
    backdrops: Array<{ file_path: string }>;
    posters: Array<{ file_path: string }>;
  };
}

export interface TMDBMovieListResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

// Genre mapping (TMDB genre IDs to names)
const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export class TMDBClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("TMDB API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Make a request to TMDB API
   */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get movies currently playing in theaters
   */
  async getNowPlaying(page = 1): Promise<TMDBMovieListResponse> {
    return this.request<TMDBMovieListResponse>("/movie/now_playing", {
      page: page.toString(),
      region: "AU", // Australia region
    });
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page = 1): Promise<TMDBMovieListResponse> {
    return this.request<TMDBMovieListResponse>("/movie/upcoming", {
      page: page.toString(),
      region: "AU",
    });
  }

  /**
   * Get popular movies
   */
  async getPopular(page = 1): Promise<TMDBMovieListResponse> {
    return this.request<TMDBMovieListResponse>("/movie/popular", {
      page: page.toString(),
    });
  }

  /**
   * Get detailed movie information including credits and images
   */
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.request<TMDBMovieDetails>(`/movie/${movieId}`, {
      append_to_response: "credits,images",
    });
  }

  /**
   * Get movie rating (vote_average) - used for rating updates
   */
  async getMovieRating(movieId: number): Promise<{ vote_average: number; popularity: number }> {
    const movie = await this.request<TMDBMovie>(`/movie/${movieId}`);
    return {
      vote_average: movie.vote_average,
      popularity: movie.popularity,
    };
  }

  /**
   * Convert TMDB poster path to full URL
   */
  static getPosterUrl(posterPath: string | null, size: "w500" | "original" = "w500"): string {
    if (!posterPath) {
      return "https://via.placeholder.com/500x750?text=No+Poster";
    }
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  /**
   * Convert TMDB backdrop path to full URL
   */
  static getBackdropUrl(backdropPath: string | null, size: "w1280" | "original" = "w1280"): string {
    if (!backdropPath) {
      return "";
    }
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }

  /**
   * Convert TMDB genre IDs to genre names
   */
  static getGenreNames(genreIds: number[]): string[] {
    return genreIds.map((id) => GENRE_MAP[id]).filter(Boolean);
  }

  /**
   * Convert TMDB genres array to genre names
   */
  static getGenreNamesFromArray(genres: Array<{ id: number; name: string }>): string[] {
    return genres.map((g) => g.name);
  }

  /**
   * Extract top cast members from credits
   */
  static getTopCast(credits: TMDBMovieDetails["credits"], limit = 10): string[] {
    if (!credits?.cast) {
      return [];
    }
    return credits.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, limit)
      .map((actor) => actor.name);
  }

  /**
   * Extract image URLs from movie details
   */
  static getImageUrls(images: TMDBMovieDetails["images"], limit = 5): string[] {
    if (!images?.backdrops) {
      return [];
    }
    return images.backdrops
      .slice(0, limit)
      .map((img) => TMDBClient.getBackdropUrl(img.file_path))
      .filter(Boolean);
  }
}
