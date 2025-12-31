import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Monitor } from 'lucide-react'
import type { Room } from '@/lib/api-types'
import { cn } from '@/lib/utils'

interface RoomDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
}

export function RoomDetailsDialog({ open, onOpenChange, room }: RoomDetailsDialogProps) {
  if (!room) return null

  const getSeatId = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(65 + row)
    return `${rowLetter}${col + 1}`
  }

  const getScreenTypeBadgeVariant = (screenType: string) => {
    switch (screenType) {
      case 'IMAX':
        return 'default'
      case '4DX':
        return 'destructive'
      case 'Dolby Cinema':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{room.name}</DialogTitle>
          <DialogDescription>Room configuration and seating layout details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Room Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Screen Type</p>
              <Badge variant={getScreenTypeBadgeVariant(room.screen_type)} className="text-sm">
                {room.screen_type}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-lg font-semibold">{room.capacity} seats</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Layout</p>
              <p className="text-lg font-semibold">
                {room.layout_config.rows} × {room.layout_config.columns}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unavailable</p>
              <p className="text-lg font-semibold">{room.unavailable?.length || 0} seats</p>
            </div>
          </div>

          {/* Seating Layout Visualization */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Seating Layout</h3>
            <div className="border rounded-lg p-3 sm:p-6 bg-linear-to-b from-slate-900 to-slate-800">
              {/* Screen */}
              <div className="mb-4 sm:mb-8 flex flex-col items-center gap-2">
                <div className="w-full max-w-2xl h-2 bg-linear-to-r from-transparent via-amber-500/50 to-transparent rounded-full" />
                <div className="flex items-center gap-2 text-amber-500 text-sm font-medium">
                  <Monitor className="h-4 w-4" />
                  SCREEN
                </div>
              </div>

              {/* Seating Grid */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                {Array.from({ length: room.layout_config.rows }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-1 sm:gap-2">
                    {/* Row Label */}
                    <div className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
                      {String.fromCharCode(65 + rowIndex)}
                    </div>

                    {/* Seats */}
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array.from({ length: room.layout_config.columns }, (_, colIndex) => {
                        const seatId = getSeatId(rowIndex, colIndex)
                        const isUnavailable = room.unavailable?.includes(seatId)

                        return (
                          <div
                            key={colIndex}
                            className={cn(
                              'w-5 h-5 sm:w-7 sm:h-7 rounded-t-lg text-[8px] sm:text-[10px] font-medium flex items-center justify-center',
                              'border sm:border-2',
                              isUnavailable
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            )}
                            title={`${seatId} - ${isUnavailable ? 'Unavailable' : 'Available'}`}
                          >
                            {colIndex + 1}
                          </div>
                        )
                      })}
                    </div>

                    {/* Row Label (right side) */}
                    <div className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
                      {String.fromCharCode(65 + rowIndex)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 sm:mt-6 flex items-center justify-center gap-3 sm:gap-6 text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-t-lg bg-emerald-500/20 border sm:border-2 border-emerald-500" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-t-lg bg-red-500/20 border sm:border-2 border-red-500" />
                  <span className="text-muted-foreground">Unavailable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unavailable Seats List */}
          {room.unavailable && room.unavailable.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Unavailable Seats</h3>
              <div className="flex flex-wrap gap-2">
                {room.unavailable.map((seat) => (
                  <Badge key={seat} variant="destructive">
                    {seat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
