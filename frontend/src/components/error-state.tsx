import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content. Please try again.',
  actionLabel = 'Try Again',
  onAction,
}: ErrorStateProps) {
  return (
    <Card className="border-red-500/20 bg-slate-800/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-red-500/10 p-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mb-6 max-w-md text-sm text-slate-400">{message}</p>
        {onAction && (
          <Button
            onClick={onAction}
            className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
