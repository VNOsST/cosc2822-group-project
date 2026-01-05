import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRooms } from '@/hooks/use-rooms-api'
import { RoomDialog } from '@/components/admin/room-dialog'
import { DeleteRoomDialog } from '@/components/admin/delete-room-dialog'
import { RoomDetailsDialog } from '@/components/admin/room-details-dialog'
import { RemoteImage } from '@/components/ui/remote-image'
import type { Room } from '@/lib/api-types'

export const Route = createFileRoute('/admin/rooms')({
  component: RoomsPage,
})

function RoomsPage() {
  const { data: rooms, isLoading, error } = useRooms()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')

  const handleCreate = () => {
    setSelectedRoom(undefined)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleDelete = (room: Room) => {
    setSelectedRoom(room)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room)
    setDetailsDialogOpen(true)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rooms</h2>
          <p className="text-muted-foreground">
            Manage your screening rooms and seating layouts.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load rooms. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Rooms ({rooms?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rooms && rooms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Screen Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Unavailable Seats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.room_id}>
                    <TableCell>
                      <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted">
                        {room.room_image_urls?.[0] ? (
                          <RemoteImage
                            src={room.room_image_urls[0]}
                            alt={room.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getScreenTypeBadgeVariant(room.screen_type)}
                      >
                        {room.screen_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{room.capacity} seats</TableCell>
                    <TableCell>
                      {room.layout_config.rows} rows ×{' '}
                      {room.layout_config.columns} seats
                    </TableCell>
                    <TableCell>
                      {room.unavailable?.length || 0} seat
                      {room.unavailable?.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(room)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(room)}
                          title="Edit Room"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(room)}
                          title="Delete Room"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No rooms found</p>
              <Button
                onClick={handleCreate}
                variant="outline"
                className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Room
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        room={selectedRoom}
        mode={dialogMode}
      />

      <DeleteRoomDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        room={selectedRoom || null}
      />

      <RoomDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        room={selectedRoom || null}
      />
    </div>
  )
}
