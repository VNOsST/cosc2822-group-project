import { useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useImage, useUploadImage } from '@/hooks/use-images-api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MultiImageUploadProps {
  value?: Array<string> // Array of S3 keys
  onChange: (keys: Array<string>) => void
  folder: 'movies' | 'reviews' | 'rooms'
  className?: string
  aspectRatio?: 'portrait' | 'video' | 'square'
  maxImages?: number
}

interface ImageItemProps {
  imageKey: string
  onRemove: () => void
  aspectRatio: 'portrait' | 'video' | 'square'
}

function ImageItem({ imageKey, onRemove, aspectRatio }: ImageItemProps) {
  const imageUrl = useImage(imageKey)

  const aspectRatioClasses = {
    portrait: 'aspect-[2/3]',
    video: 'aspect-video',
    square: 'aspect-square',
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-md border border-slate-700 bg-slate-900/50',
        aspectRatioClasses[aspectRatio],
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Uploaded"
          className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-800">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/50">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
        >
          <X className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  )
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder,
  className,
  aspectRatio = 'video',
  maxImages = 5,
}: MultiImageUploadProps) {
  const [isHovering, setIsHovering] = useState(false)
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed max
    if (value.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`)
      return
    }

    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`)
        return
      }
    }

    try {
      // Upload all files in parallel using mutateAsync
      const uploadPromises = Array.from(files).map((file) =>
        uploadImage({ file, folder }),
      )

      const keys = await Promise.all(uploadPromises)
      onChange([...value, ...keys])
      toast.success(`${keys.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Failed to upload images:', error)
      toast.error('Failed to upload one or more images')
    }

    // Reset the input
    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const canUploadMore = value.length < maxImages

  const aspectRatioClasses = {
    portrait: 'aspect-[2/3]',
    video: 'aspect-video',
    square: 'aspect-square',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Display uploaded images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((imageKey, index) => (
            <ImageItem
              key={`${imageKey}-${index}`}
              imageKey={imageKey}
              onRemove={() => handleRemove(index)}
              aspectRatio={aspectRatio}
            />
          ))}
        </div>
      )}

      {/* Upload new images */}
      {canUploadMore && (
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-dashed border-slate-700 bg-slate-900/50',
            aspectRatioClasses[aspectRatio],
            !value.length && 'min-h-[200px]',
          )}
        >
          <label
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 transition-colors hover:bg-slate-800/50"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : (
              <Upload
                className={cn(
                  'h-8 w-8 text-slate-400 transition-colors',
                  isHovering && 'text-primary',
                )}
              />
            )}
            <span className="text-sm font-medium text-slate-400">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <span className="text-xs text-slate-500">
              {value.length}/{maxImages} images
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isUploading}
              multiple
            />
          </label>
        </div>
      )}

      {!canUploadMore && (
        <p className="text-xs text-slate-500 text-center">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  )
}
