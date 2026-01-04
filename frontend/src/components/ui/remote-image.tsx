import { Loader2 } from 'lucide-react'
import { useImage } from '@/hooks/use-images-api'
import { cn } from '@/lib/utils'

interface RemoteImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string // Can be an S3 key or a full URL
  fallback?: React.ReactNode
}

export function RemoteImage({
  src,
  className,
  fallback,
  alt,
  ...props
}: RemoteImageProps) {
  const isUrl = src?.startsWith('http') || src?.startsWith('blob:') || src?.startsWith('/')
  const s3Url = useImage(isUrl ? undefined : src)
  
  const finalSrc = isUrl ? src : s3Url

  if (!src) {
    return <div className={cn('flex items-center justify-center bg-slate-800', className)}>{fallback}</div>
  }

  if (!isUrl && !s3Url) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-800', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn('object-cover', className)}
      {...props}
    />
  )
}
