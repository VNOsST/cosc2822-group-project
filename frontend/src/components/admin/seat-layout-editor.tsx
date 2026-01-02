import { cn } from '@/lib/utils'
import { Monitor } from 'lucide-react'

interface SeatLayoutEditorProps {
  rows: number
  columns: number
  unavailableSeats: Array<string>
  onUnavailableSeatsChange: (seats: Array<string>) => void
}

export function SeatLayoutEditor({
  rows,
  columns,
  unavailableSeats,
  onUnavailableSeatsChange,
}: SeatLayoutEditorProps) {
  const toggleSeat = (seatId: string) => {
    if (unavailableSeats.includes(seatId)) {
      onUnavailableSeatsChange(unavailableSeats.filter((s) => s !== seatId))
    } else {
      onUnavailableSeatsChange([...unavailableSeats, seatId])
    }
  }

  const getSeatId = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(65 + row) // A, B, C...
    return `${rowLetter}${col + 1}`
  }

  // Calculate dynamic seat size based on number of columns
  const getSeatSize = () => {
    if (columns <= 12) return 'w-8 h-8 text-xs'
    if (columns <= 20) return 'w-7 h-7 text-[10px]'
    if (columns <= 30) return 'w-6 h-6 text-[9px]'
    return 'w-5 h-5 text-[8px]'
  }

  const seatSizeClass = getSeatSize()

  return (
    <div className="border rounded-lg p-3 sm:p-6 bg-linear-to-b from-slate-900 to-slate-800 overflow-hidden">
      {/* Screen */}
      <div className="mb-4 sm:mb-8 flex flex-col items-center gap-2">
        <div className="w-full max-w-2xl h-1.5 sm:h-2 bg-linear-to-r from-transparent via-amber-500/50 to-transparent rounded-full" />
        <div className="flex items-center gap-2 text-amber-500 text-xs sm:text-sm font-medium">
          <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
          SCREEN
        </div>
      </div>

      {/* Seating Grid Container with Horizontal Scroll */}
      <div className="overflow-x-auto overflow-y-visible pb-2">
        <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-max mx-auto">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-1 sm:gap-2">
              {/* Row Label */}
              <div className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                {String.fromCharCode(65 + rowIndex)}
              </div>

              {/* Seats */}
              <div className="flex gap-0.5 sm:gap-1">
                {Array.from({ length: columns }, (_, colIndex) => {
                  const seatId = getSeatId(rowIndex, colIndex)
                  const isUnavailable = unavailableSeats.includes(seatId)

                  return (
                    <button
                      key={colIndex}
                      type="button"
                      onClick={() => toggleSeat(seatId)}
                      className={cn(
                        seatSizeClass,
                        'rounded-t-lg font-medium transition-all duration-200',
                        'hover:scale-110 active:scale-95',
                        'border-2 flex items-center justify-center',
                        'shrink-0',
                        isUnavailable
                          ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30',
                      )}
                      title={`${seatId} - ${isUnavailable ? 'Unavailable' : 'Available'}`}
                    >
                      {colIndex + 1}
                    </button>
                  )
                })}
              </div>

              {/* Row Label (right side) */}
              <div className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                {String.fromCharCode(65 + rowIndex)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Hint for Large Layouts */}
      {columns > 15 && (
        <div className="mt-2 text-center text-xs text-muted-foreground/70">
          ← Scroll horizontally to view all seats →
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-3 sm:gap-6 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-t-lg bg-emerald-500/20 border-2 border-emerald-500 shrink-0" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-t-lg bg-red-500/20 border-2 border-red-500 shrink-0" />
          <span className="text-muted-foreground">Unavailable</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-muted-foreground">
        {unavailableSeats.length} seat{unavailableSeats.length !== 1 ? 's' : ''}{' '}
        marked as unavailable
      </div>
    </div>
  )
}
