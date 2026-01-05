import { useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useImage, useUploadImage } from '@/hooks/use-images-api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string // S3 key
  onChange: (key: string) => void
  folder: 'movies' | 'reviews' | 'rooms'
  className?: string
  aspectRatio?: 'portrait' | 'video' | 'square'
}

export function ImageUpload({
  value,
  onChange,
  folder,
  className,
  aspectRatio = 'video',
}: ImageUploadProps) {
  const [isHovering, setIsHovering] = useState(false)
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage()

  // Resolve the current value (key) to a URL
  const imageUrl = useImage(value)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error('Image must be less than 5MB')
      return
    }

    uploadImage(
      { file, folder },
      {
        onSuccess: (key) => {
          onChange(key)
          toast.success('Image uploaded successfully')
        },
        onError: () => {
          toast.error('Failed to upload image')
        },
      },
    )
  }

  const handleRemove = () => {
    onChange('')
  }

  const aspectRatioClasses = {
    portrait: 'aspect-[2/3]',
    video: 'aspect-video',
    square: 'aspect-square',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-dashed border-slate-700 bg-slate-900/50',
        aspectRatioClasses[aspectRatio],
        className,
      )}
    >
      {value ? (
        <div className="group relative h-full w-full">
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

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
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
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  )
}
