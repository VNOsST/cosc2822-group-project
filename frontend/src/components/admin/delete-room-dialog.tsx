import { toast } from 'sonner'
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
import { useDeleteRoom } from '@/hooks/use-rooms-api'
import type { Room } from '@/lib/api-types'

interface DeleteRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
}

export function DeleteRoomDialog({ open, onOpenChange, room }: DeleteRoomDialogProps) {
  const deleteRoom = useDeleteRoom()

  const handleDelete = async () => {
    if (!room) return

    try {
      await deleteRoom.mutateAsync(room.room_id)
      toast.success('Room deleted successfully')
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || 'Failed to delete room'
      toast.error(errorMessage)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{room?.name}</strong>. This action cannot be
            undone.
            {room && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Room Details:</div>
                <div>Capacity: {room.capacity} seats</div>
                <div>Screen Type: {room.screen_type}</div>
                <div>
                  Layout: {room.layout_config.rows} rows × {room.layout_config.columns} seats
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRoom.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRoom.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleteRoom.isPending ? 'Deleting...' : 'Delete Room'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
