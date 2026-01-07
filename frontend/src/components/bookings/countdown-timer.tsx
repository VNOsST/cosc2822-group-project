/**
 * Countdown Timer Component
 * Shows remaining time for seat lock expiration
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  expiresAt: number // Unix timestamp in milliseconds
  onExpire?: () => void
  onWarning?: () => void // Called when less than 2 minutes remaining
  className?: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CountdownTimer({
  expiresAt,
  onExpire,
  onWarning,
  className,
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const now = Date.now()
    return Math.max(0, Math.floor((expiresAt - now) / 1000))
  })

  const isWarning = remainingSeconds <= 120 // Less than 2 minutes
  const isCritical = remainingSeconds <= 60 // Less than 1 minute

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setRemainingSeconds(remaining)

      if (remaining <= 120 && remaining > 119 && onWarning) {
        onWarning()
      }

      if (remaining === 0) {
        clearInterval(interval)
        if (onExpire) {
          onExpire()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpire, onWarning])

  if (remainingSeconds === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-red-400', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Lock expired</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isCritical
          ? 'animate-pulse bg-red-500/20 text-red-400'
          : isWarning
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-slate-700/50 text-slate-300',
        className,
      )}
    >
      <Clock className="h-4 w-4" />
      <span>
        {isCritical
          ? 'Hurry! '
          : isWarning
            ? 'Time running out: '
            : 'Time remaining: '}
        <span className="font-mono">{formatTime(remainingSeconds)}</span>
      </span>
    </div>
  )
}

/**
 * Simple inline countdown display
 */
export function InlineCountdown({
  expiresAt,
  prefix = 'Expires in',
}: {
  expiresAt: number
  prefix?: string
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const now = Date.now()
    return Math.max(0, Math.floor((expiresAt - now) / 1000))
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setRemainingSeconds(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (remainingSeconds === 0) {
    return <span className="text-red-400">Expired</span>
  }

  const isCritical = remainingSeconds <= 60

  return (
    <span className={isCritical ? 'text-red-400' : 'text-slate-400'}>
      {prefix} <span className="font-mono">{formatTime(remainingSeconds)}</span>
    </span>
  )
}
