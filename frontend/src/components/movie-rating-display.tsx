import { Info, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCompositeRating } from '@/hooks/use-composite-rating'
import type { Movie } from '@/lib/api-types'
import { cn } from '@/lib/utils'

interface MovieRatingDisplayProps {
  movie: Movie
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function MovieRatingDisplay({
  movie,
  className,
  showLabel = false,
  size = 'md',
}: MovieRatingDisplayProps) {
  const { score, explanation, isLoading } = useCompositeRating(movie)

  if (isLoading) {
    return (
      <Badge
        className={cn(
          'animate-pulse bg-slate-700 text-slate-400',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
          className,
        )}
      >
        ...
      </Badge>
    )
  }

  const iconSize =
    size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const textSize =
    size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-sm'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <Badge
              className={cn(
                'flex items-center gap-1 bg-amber-500 font-bold text-slate-900 hover:bg-amber-400 transition-colors',
                size === 'sm'
                  ? 'px-1.5 py-0.5'
                  : size === 'lg'
                    ? 'px-4 py-2'
                    : 'px-2.5 py-1',
                textSize,
              )}
            >
              <Star className={cn('fill-current', iconSize)} />
              {score.toFixed(1)}
              {showLabel && <span className="ml-1 font-medium">CineScore</span>}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>{explanation}</p>
        </TooltipContent>
      </Tooltip>
      {size === 'lg' && (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Weighted Score
        </span>
      )}
    </div>
  )
}
