/**
 * RBAC Testing Dashboard Component
 * Demonstrates admin endpoints and role-based access control
 */

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import {
  useMovies,
  useCreateMovie,
  useDeleteMovie,
} from '@/hooks/use-movies-api'
import { useRooms, useCreateRoom, useDeleteRoom } from '@/hooks/use-rooms-api'
import {
  useShowtimes,
  useCreateShowtime,
  useDeleteShowtime,
} from '@/hooks/use-showtimes-api'

export function RbacTestDashboard() {
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.role === 'Admins'

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to test RBAC functionality.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RBAC Testing Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Current User: {user?.email} | Role:{' '}
            {isAdmin ? 'Admin' : 'Regular User'}
          </p>
        </div>
      </div>

      {!isAdmin && (
        <Alert variant="destructive">
          <AlertDescription>
            You are logged in as a regular user. Admin operations will be
            rejected by the backend.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="movies">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="showtimes">Showtimes</TabsTrigger>
        </TabsList>

        <TabsContent value="movies">
          <MoviesTestPanel isAdmin={isAdmin || false} />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomsTestPanel isAdmin={isAdmin || false} />
        </TabsContent>

        <TabsContent value="showtimes">
          <ShowtimesTestPanel isAdmin={isAdmin || false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MoviesTestPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: movies, isLoading, error } = useMovies()
  const createMovie = useCreateMovie()
  const deleteMovie = useDeleteMovie()

  const [formData, setFormData] = React.useState({
    tmdb_id: '',
    title: '',
    synopsis: '',
    runtime: '',
    release_date: '',
    poster_url: '',
    genres: '',
    cast: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMovie.mutateAsync({
        tmdb_id: formData.tmdb_id,
        title: formData.title,
        synopsis: formData.synopsis,
        runtime: Number.parseInt(formData.runtime),
        release_date: formData.release_date,
        poster_url: formData.poster_url,
        genres: formData.genres.split(',').map((g) => g.trim()),
        cast: formData.cast.split(',').map((c) => c.trim()),
        image_urls: [],
        tmdb_popularity_score: 0,
      })
      // Reset form
      setFormData({
        tmdb_id: '',
        title: '',
        synopsis: '',
        runtime: '',
        release_date: '',
        poster_url: '',
        genres: '',
        cast: '',
      })
    } catch (err) {
      console.error('Failed to create movie:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await deleteMovie.mutateAsync(id)
      } catch (err) {
        console.error('Failed to delete movie:', err)
      }
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Movie (Admin Only)</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Fill out the form to create a new movie'
              : 'This will fail with 403 Forbidden - Admin role required'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="tmdb_id">TMDB ID</Label>
              <Input
                id="tmdb_id"
                value={formData.tmdb_id}
                onChange={(e) =>
                  setFormData({ ...formData, tmdb_id: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea
                id="synopsis"
                value={formData.synopsis}
                onChange={(e) =>
                  setFormData({ ...formData, synopsis: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="runtime">Runtime (minutes)</Label>
              <Input
                id="runtime"
                type="number"
                value={formData.runtime}
                onChange={(e) =>
                  setFormData({ ...formData, runtime: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) =>
                  setFormData({ ...formData, release_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="poster_url">Poster URL</Label>
              <Input
                id="poster_url"
                type="url"
                value={formData.poster_url}
                onChange={(e) =>
                  setFormData({ ...formData, poster_url: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="genres">Genres (comma-separated)</Label>
              <Input
                id="genres"
                value={formData.genres}
                onChange={(e) =>
                  setFormData({ ...formData, genres: e.target.value })
                }
                placeholder="Action, Thriller, Sci-Fi"
                required
              />
            </div>
            <div>
              <Label htmlFor="cast">Cast (comma-separated)</Label>
              <Input
                id="cast"
                value={formData.cast}
                onChange={(e) =>
                  setFormData({ ...formData, cast: e.target.value })
                }
                placeholder="Actor 1, Actor 2, Actor 3"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={createMovie.isPending}
              className="w-full"
            >
              {createMovie.isPending ? 'Creating...' : 'Create Movie'}
            </Button>
            {createMovie.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createMovie.error instanceof Error
                    ? createMovie.error.message
                    : 'Failed to create movie'}
                </AlertDescription>
              </Alert>
            )}
            {createMovie.isSuccess && (
              <Alert>
                <AlertDescription>Movie created successfully!</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movies List</CardTitle>
          <CardDescription>
            All movies (public endpoint - no auth required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading movies...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load movies</AlertDescription>
            </Alert>
          )}
          {movies && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-start justify-between border-b pb-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{movie.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {movie.synopsis.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {movie.runtime} min | Rating: {movie.rating}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(movie.id)}
                    disabled={deleteMovie.isPending}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RoomsTestPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: rooms, isLoading, error } = useRooms()
  const createRoom = useCreateRoom()
  const deleteRoom = useDeleteRoom()

  const [formData, setFormData] = React.useState({
    name: '',
    capacity: '',
    screen_type: '',
    rows: '',
    columns: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRoom.mutateAsync({
        name: formData.name,
        capacity: Number.parseInt(formData.capacity),
        screen_type: formData.screen_type,
        layout_config: {
          rows: Number.parseInt(formData.rows),
          columns: Number.parseInt(formData.columns),
        },
      })
      setFormData({
        name: '',
        capacity: '',
        screen_type: '',
        rows: '',
        columns: '',
      })
    } catch (err) {
      console.error('Failed to create room:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoom.mutateAsync(id)
      } catch (err) {
        console.error('Failed to delete room:', err)
      }
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Room (Admin Only)</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Fill out the form to create a new room'
              : 'This will fail with 403 Forbidden - Admin role required'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="room_name">Room Name</Label>
              <Input
                id="room_name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="screen_type">Screen Type</Label>
              <Input
                id="screen_type"
                value={formData.screen_type}
                onChange={(e) =>
                  setFormData({ ...formData, screen_type: e.target.value })
                }
                placeholder="IMAX, Standard, 4DX"
                required
              />
            </div>
            <div>
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                value={formData.rows}
                onChange={(e) =>
                  setFormData({ ...formData, rows: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="columns">Columns</Label>
              <Input
                id="columns"
                type="number"
                value={formData.columns}
                onChange={(e) =>
                  setFormData({ ...formData, columns: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              disabled={createRoom.isPending}
              className="w-full"
            >
              {createRoom.isPending ? 'Creating...' : 'Create Room'}
            </Button>
            {createRoom.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createRoom.error instanceof Error
                    ? createRoom.error.message
                    : 'Failed to create room'}
                </AlertDescription>
              </Alert>
            )}
            {createRoom.isSuccess && (
              <Alert>
                <AlertDescription>Room created successfully!</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rooms List</CardTitle>
          <CardDescription>
            All rooms (public endpoint - no auth required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading rooms...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load rooms</AlertDescription>
            </Alert>
          )}
          {rooms && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.room_id}
                  className="flex items-start justify-between border-b pb-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {room.capacity} | Screen: {room.screen_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Layout: {room.layout_config.rows} rows ×{' '}
                      {room.layout_config.columns} columns
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room.room_id)}
                    disabled={deleteRoom.isPending}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ShowtimesTestPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: showtimes, isLoading, error } = useShowtimes()
  const createShowtime = useCreateShowtime()
  const deleteShowtime = useDeleteShowtime()

  const [formData, setFormData] = React.useState({
    movie_id: '',
    room_id: '',
    start_time: '',
    endtime: '',
    price: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createShowtime.mutateAsync({
        movie_id: formData.movie_id,
        room_id: formData.room_id,
        start_time: formData.start_time,
        endtime: formData.endtime,
        price: Number.parseFloat(formData.price),
      })
      setFormData({
        movie_id: '',
        room_id: '',
        start_time: '',
        endtime: '',
        price: '',
      })
    } catch (err) {
      console.error('Failed to create showtime:', err)
    }
  }

  const handleDelete = async (movieId: string, startTime: string) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        await deleteShowtime.mutateAsync({ movieId, startTime })
      } catch (err) {
        console.error('Failed to delete showtime:', err)
      }
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Showtime (Admin Only)</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Fill out the form to create a new showtime'
              : 'This will fail with 403 Forbidden - Admin role required'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="st_movie_id">Movie ID</Label>
              <Input
                id="st_movie_id"
                value={formData.movie_id}
                onChange={(e) =>
                  setFormData({ ...formData, movie_id: e.target.value })
                }
                placeholder="Get from Movies tab"
                required
              />
            </div>
            <div>
              <Label htmlFor="st_room_id">Room ID</Label>
              <Input
                id="st_room_id"
                value={formData.room_id}
                onChange={(e) =>
                  setFormData({ ...formData, room_id: e.target.value })
                }
                placeholder="Get from Rooms tab"
                required
              />
            </div>
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="endtime">End Time</Label>
              <Input
                id="endtime"
                type="datetime-local"
                value={formData.endtime}
                onChange={(e) =>
                  setFormData({ ...formData, endtime: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              disabled={createShowtime.isPending}
              className="w-full"
            >
              {createShowtime.isPending ? 'Creating...' : 'Create Showtime'}
            </Button>
            {createShowtime.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createShowtime.error instanceof Error
                    ? createShowtime.error.message
                    : 'Failed to create showtime'}
                </AlertDescription>
              </Alert>
            )}
            {createShowtime.isSuccess && (
              <Alert>
                <AlertDescription>
                  Showtime created successfully!
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Showtimes List</CardTitle>
          <CardDescription>
            All showtimes (public endpoint - no auth required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading showtimes...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load showtimes</AlertDescription>
            </Alert>
          )}
          {showtimes && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {showtimes.map((showtime) => (
                <div
                  key={`${showtime.movie_id}-${showtime.start_time}`}
                  className="flex items-start justify-between border-b pb-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Movie ID: {showtime.movie_id}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Room: {showtime.room_id} | Price: ${showtime.price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(showtime.start_time).toLocaleString()} -{' '}
                      {new Date(showtime.endtime).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleDelete(showtime.movie_id, showtime.start_time)
                    }
                    disabled={deleteShowtime.isPending}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
