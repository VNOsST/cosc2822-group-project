import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { useCreateMovie, useUpdateMovie } from '@/hooks/use-movies-api'
import { useDeleteImages } from '@/hooks/use-images-api'
import type { Movie } from '@/lib/api-types'

interface MovieDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movie?: Movie
  mode: 'create' | 'edit'
}

export function MovieDialog({
  open,
  onOpenChange,
  movie,
  mode,
}: MovieDialogProps) {
  const [title, setTitle] = useState('')
  const [tmdbId, setTmdbId] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [runtime, setRuntime] = useState(120)
  const [releaseDate, setReleaseDate] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [imageUrls, setImageUrls] = useState<Array<string>>([])
  const [genres, setGenres] = useState('')
  const [cast, setCast] = useState('')
  
  // Track the initial poster URL to identify if a new image was uploaded
  const initialPosterRef = useRef('')
  // Track the initial image_urls to identify new uploads
  const initialImageUrlsRef = useRef<Array<string>>([])
  // Track if the form was successfully saved
  const isSavedRef = useRef(false)
  const [showCloseAlert, setShowCloseAlert] = useState(false)

  const createMovie = useCreateMovie()
  const updateMovie = useUpdateMovie()
  const deleteImages = useDeleteImages()

  useEffect(() => {
    if (open) {
      // Reset saved state when dialog opens
      isSavedRef.current = false
      setShowCloseAlert(false)
      
      if (movie && mode === 'edit') {
        setTitle(movie.title)
        setTmdbId(movie.tmdb_id)
        setSynopsis(movie.synopsis)
        setRuntime(movie.runtime)
        setReleaseDate(movie.release_date)
        setPosterUrl(movie.poster_url)
        setImageUrls(movie.image_urls || [])
        setGenres(movie.genres.join(', '))
        setCast(movie.cast.join(', '))
        initialPosterRef.current = movie.poster_url
        initialImageUrlsRef.current = movie.image_urls || []
      } else {
        // Reset for create mode
        setTitle('')
        setTmdbId('')
        setSynopsis('')
        setRuntime(120)
        setReleaseDate(new Date().toISOString().split('T')[0])
        setPosterUrl('')
        setImageUrls([])
        setGenres('')
        setCast('')
        initialPosterRef.current = ''
        initialImageUrlsRef.current = []
      }
    }
  }, [movie, mode, open])

  const hasUnsavedImage = () => {
    const hasUnsavedPoster =
      posterUrl &&
      posterUrl !== initialPosterRef.current &&
      !posterUrl.startsWith('http')
    
    // Check if there are any new images in imageUrls
    const newImageUrls = imageUrls.filter(
      (url) => !initialImageUrlsRef.current.includes(url) && !url.startsWith('http')
    )
    const hasUnsavedImages = newImageUrls.length > 0
    
    return hasUnsavedPoster || hasUnsavedImages
  }

  const getUnsavedImages = (): Array<string> => {
    const unsaved: Array<string> = []
    
    // Add poster if it's new and not an HTTP URL
    if (
      posterUrl &&
      posterUrl !== initialPosterRef.current &&
      !posterUrl.startsWith('http')
    ) {
      unsaved.push(posterUrl)
    }
    
    // Add new images from imageUrls
    const newImageUrls = imageUrls.filter(
      (url) => !initialImageUrlsRef.current.includes(url) && !url.startsWith('http')
    )
    unsaved.push(...newImageUrls)
    
    return unsaved
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedImage() && !isSavedRef.current) {
      setShowCloseAlert(true)
      return
    }
    onOpenChange(newOpen)
  }

  const handleDiscardChanges = () => {
    const unsavedImages = getUnsavedImages()
    
    if (unsavedImages.length > 0) {
      // Use batch delete for better performance
      deleteImages.mutate(unsavedImages)
    }
    
    setShowCloseAlert(false)
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a movie title')
      return
    }

    if (!tmdbId.trim()) {
      toast.error('Please enter a TMDB ID')
      return
    }

    const movieData = {
      title: title.trim(),
      tmdb_id: tmdbId.trim(),
      synopsis: synopsis.trim(),
      runtime,
      release_date: releaseDate,
      poster_url: posterUrl.trim(),
      image_urls: imageUrls,
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      cast: cast
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      tmdb_popularity_score: 0, // Default
    }

    try {
      if (mode === 'create') {
        await createMovie.mutateAsync(movieData)
        toast.success('Movie created successfully')
      } else if (movie) {
        await updateMovie.mutateAsync({
          id: movie.id,
          ...movieData,
        })
        toast.success('Movie updated successfully')
      }
      
      // Mark as saved so we don't delete the image on close
      isSavedRef.current = true
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        (mode === 'create'
          ? 'Failed to create movie'
          : 'Failed to update movie')
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Movie' : 'Edit Movie'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new movie to the catalog.'
              : 'Update movie details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Inception"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tmdbId">TMDB ID</Label>
                <Input
                  id="tmdbId"
                  value={tmdbId}
                  onChange={(e) => setTmdbId(e.target.value)}
                  placeholder="e.g., 27205"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="runtime">Runtime (min)</Label>
                  <Input
                    id="runtime"
                    type="number"
                    min="1"
                    value={runtime}
                    onChange={(e) => setRuntime(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          <div className="space-y-2">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea
              id="synopsis"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Movie plot summary..."
              rows={3}
            />
          </div>

          <div className="space-y-2">

              <Label>Poster Image</Label>
              <ImageUpload
                value={posterUrl}
                onChange={setPosterUrl}
                folder="movies"
                aspectRatio="portrait"
                className="h-[240px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a poster or enter a URL below
              </p>
              <Input
                id="posterUrl"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://... or S3 key"
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genres">Genres (comma separated)</Label>
            <Input
              id="genres"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="Action, Sci-Fi, Thriller"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cast">Cast (comma separated)</Label>
            <Input
              id="cast"
              value={cast}
              onChange={(e) => setCast(e.target.value)}
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Images</Label>
            <MultiImageUpload
              value={imageUrls}
              onChange={setImageUrls}
              folder="movies"
              aspectRatio="video"
              maxImages={5}
            />
            <p className="text-xs text-muted-foreground">
              Upload up to 5 additional images for the movie gallery
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={hasUnsavedImage() ? handleDiscardChanges : () => onOpenChange(false)}
              disabled={createMovie.isPending || updateMovie.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMovie.isPending || updateMovie.isPending}
              className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {createMovie.isPending || updateMovie.isPending
                ? 'Saving...'
                : mode === 'create'
                  ? 'Add Movie'
                  : 'Update Movie'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showCloseAlert} onOpenChange={setShowCloseAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const unsavedCount = getUnsavedImages().length
                return unsavedCount === 1
                  ? 'You have uploaded an image but haven\'t saved the movie yet. Closing this dialog will discard your changes and delete the uploaded image.'
                  : `You have uploaded ${unsavedCount} images but haven't saved the movie yet. Closing this dialog will discard your changes and delete the uploaded images.`
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="bg-red-500 hover:bg-red-600"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
