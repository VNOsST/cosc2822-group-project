import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { rooms } from '@/data/dummy-data'

export const Route = createFileRoute('/_authenticated/rooms')({
  component: RoomsPage,
})

function RoomsPage() {
  const handleEdit = (id: string) => {
    toast.info(`Edit room ${id} - Feature coming soon`)
  }

  const handleDelete = (id: string) => {
    toast.info(`Delete room ${id} - Feature coming soon`)
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
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Screen Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Layout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        room.screenType === 'IMAX'
                          ? 'default'
                          : room.screenType === '4DX'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {room.screenType}
                    </Badge>
                  </TableCell>
                  <TableCell>{room.capacity} seats</TableCell>
                  <TableCell>
                    {room.rows} rows × {room.seatsPerRow} seats
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.isActive ? 'default' : 'outline'}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(room.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(room.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
