import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRoom, useUpdateRoom } from "@/hooks/use-rooms-api";
import type { Room } from "@/lib/api-types";
import { SeatLayoutEditor } from "./seat-layout-editor";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room;
  mode: "create" | "edit";
}

export function RoomDialog({
  open,
  onOpenChange,
  room,
  mode,
}: RoomDialogProps) {
  const [name, setName] = useState("");
  const [screenType, setScreenType] = useState("Standard");
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(12);
  const [unavailableSeats, setUnavailableSeats] = useState<Array<string>>([]);

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  useEffect(() => {
    if (room && mode === "edit") {
      setName(room.name);
      setScreenType(room.screen_type);
      setRows(room.layout_config.rows);
      setColumns(room.layout_config.columns);
      setUnavailableSeats(room.unavailable || []);
    } else {
      // Reset for create mode
      setName("");
      setScreenType("Standard");
      setRows(8);
      setColumns(12);
      setUnavailableSeats([]);
    }
  }, [room, mode, open]);

  const capacity = rows * columns - unavailableSeats.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (rows < 1 || rows > 26) {
      toast.error("Rows must be between 1 and 26");
      return;
    }

    if (columns < 1 || columns > 50) {
      toast.error("Columns must be between 1 and 50");
      return;
    }

    const roomData = {
      name: name.trim(),
      capacity,
      screen_type: screenType,
      room_image_urls: [],
      layout_config: {
        rows,
        columns,
      },
      unavailable: unavailableSeats,
    };

    try {
      if (mode === "create") {
        await createRoom.mutateAsync(roomData);
        toast.success("Room created successfully");
      } else if (room) {
        await updateRoom.mutateAsync({
          id: room.room_id,
          ...roomData,
        });
        toast.success("Room updated successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        mode === "create" ? "Failed to create room" : "Failed to update room"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Room" : "Edit Room"}
          </DialogTitle>
          <DialogDescription>
            Configure the screening room details and seating layout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Theater 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenType">Screen Type</Label>
              <Select value={screenType} onValueChange={setScreenType}>
                <SelectTrigger id="screenType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="IMAX">IMAX</SelectItem>
                  <SelectItem value="4DX">4DX</SelectItem>
                  <SelectItem value="Dolby Cinema">Dolby Cinema</SelectItem>
                  <SelectItem value="ScreenX">ScreenX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="26"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-muted-foreground">1-26 (A-Z)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="columns">Seats per Row</Label>
              <Input
                id="columns"
                type="number"
                min="1"
                max="50"
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-muted-foreground">1-50</p>
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Total Capacity</Label>
              <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-semibold">
                {capacity} seats
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Seating Layout</Label>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
              Click on seats to mark them as unavailable (e.g., wheelchair
              spaces, aisles)
            </p>
            <SeatLayoutEditor
              rows={rows}
              columns={columns}
              unavailableSeats={unavailableSeats}
              onUnavailableSeatsChange={setUnavailableSeats}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRoom.isPending || updateRoom.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoom.isPending || updateRoom.isPending}
              className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {createRoom.isPending || updateRoom.isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create Room"
                  : "Update Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
