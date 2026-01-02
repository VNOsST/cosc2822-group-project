import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Film,
  Plus,
  Trash2,
} from "lucide-react";
import { addDays, addMinutes, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMovies } from "@/hooks/use-movies-api";
import { useRooms } from "@/hooks/use-rooms-api";
import { useCreateBulkShowtimes } from "@/hooks/use-showtimes-api";

interface CreateBulkShowtimesDialogProps {
  trigger?: React.ReactNode;
}

type RecurrenceType = "daily" | "custom";

interface TimeSlot {
  id: string;
  time: string;
}

export function CreateBulkShowtimesDialog({
  trigger,
}: CreateBulkShowtimesDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RecurrenceType>("daily");

  // Common fields
  const [formData, setFormData] = useState({
    movie_id: "",
    room_id: "",
    price: "",
  });

  // Daily recurrence fields
  const [dailyData, setDailyData] = useState({
    start_date: "",
    end_date: "",
    time_slots: [{ id: "1", time: "" }] as Array<TimeSlot>,
  });

  // Custom dates fields
  const [customDates, setCustomDates] = useState([
    { id: "1", date: "", time: "" },
  ]);

  const { data: movies, isLoading: moviesLoading } = useMovies();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const createBulkShowtimes = useCreateBulkShowtimes();

  const selectedMovie = movies?.find((m) => m.id === formData.movie_id);

  // Generate preview of showtimes to be created
  const generateShowtimesPreview = () => {
    if (
      !formData.movie_id ||
      !formData.room_id ||
      !formData.price ||
      !selectedMovie
    ) {
      return [];
    }

    const showtimes: Array<{
      date: string;
      time: string;
      start_time: string;
      endtime: string;
    }> = [];

    if (activeTab === "daily") {
      if (!dailyData.start_date || !dailyData.end_date) return [];

      const startDate = new Date(dailyData.start_date);
      const endDate = new Date(dailyData.end_date);

      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        dailyData.time_slots.forEach((slot) => {
          if (slot.time) {
            const dateStr = format(d, "yyyy-MM-dd");
            const startDateTime = new Date(`${dateStr}T${slot.time}:00`);
            const endDateTime = addMinutes(
              startDateTime,
              selectedMovie.runtime
            );

            showtimes.push({
              date: dateStr,
              time: slot.time,
              start_time: startDateTime.toISOString(),
              endtime: endDateTime.toISOString(),
            });
          }
        });
      }
    } else {
      customDates.forEach((custom) => {
        if (custom.date && custom.time) {
          const startDateTime = new Date(`${custom.date}T${custom.time}:00`);
          const endDateTime = addMinutes(startDateTime, selectedMovie.runtime);

          showtimes.push({
            date: custom.date,
            time: custom.time,
            start_time: startDateTime.toISOString(),
            endtime: endDateTime.toISOString(),
          });
        }
      });
    }

    return showtimes;
  };

  const showtimesPreview = generateShowtimesPreview();

  const handleAddTimeSlot = () => {
    setDailyData((prev) => ({
      ...prev,
      time_slots: [...prev.time_slots, { id: Date.now().toString(), time: "" }],
    }));
  };

  const handleRemoveTimeSlot = (id: string) => {
    setDailyData((prev) => ({
      ...prev,
      time_slots: prev.time_slots.filter((slot) => slot.id !== id),
    }));
  };

  const handleTimeSlotChange = (id: string, time: string) => {
    setDailyData((prev) => ({
      ...prev,
      time_slots: prev.time_slots.map((slot) =>
        slot.id === id ? { ...slot, time } : slot
      ),
    }));
  };

  const handleAddCustomDate = () => {
    setCustomDates((prev) => [
      ...prev,
      { id: Date.now().toString(), date: "", time: "" },
    ]);
  };

  const handleRemoveCustomDate = (id: string) => {
    setCustomDates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCustomDateChange = (
    id: string,
    field: "date" | "time",
    value: string
  ) => {
    setCustomDates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.movie_id || !formData.room_id || !formData.price) {
      toast.error("Please fill in movie, room, and price");
      return;
    }

    if (showtimesPreview.length === 0) {
      toast.error("Please add at least one showtime");
      return;
    }

    // Only send start_time, backend will calculate endtime
    const showtimesData = showtimesPreview.map((showtime) => ({
      movie_id: formData.movie_id,
      room_id: formData.room_id,
      start_time: showtime.start_time,
      price: parseFloat(formData.price),
    }));

    try {
      await createBulkShowtimes.mutateAsync(showtimesData);
      toast.success(`Successfully created ${showtimesData.length} showtimes`);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create bulk showtimes";
      toast.error(errorMessage);

      // Show detailed conflict information if available
      if (error.response?.conflicts) {
        error.response.conflicts.forEach((conflict: any) => {
          toast.error(
            `Conflict at index ${conflict.index}: ${conflict.reason}`
          );
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({ movie_id: "", room_id: "", price: "" });
    setDailyData({
      start_date: "",
      end_date: "",
      time_slots: [{ id: "1", time: "" }],
    });
    setCustomDates([{ id: "1", date: "", time: "" }]);
    setActiveTab("daily");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bulk Create Showtimes</DialogTitle>
          <DialogDescription>
            Create multiple showtimes at once for recurring screenings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-movie" className="flex items-center gap-2">
                <Film className="h-4 w-4 text-amber-500" />
                Movie
              </Label>
              <Select
                value={formData.movie_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, movie_id: value }))
                }
                disabled={moviesLoading}
              >
                <SelectTrigger id="bulk-movie">
                  <SelectValue placeholder="Select a movie" />
                </SelectTrigger>
                <SelectContent>
                  {movies?.map((movie) => (
                    <SelectItem key={movie.id} value={movie.id}>
                      {movie.title} ({movie.runtime}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-room" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                Room
              </Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, room_id: value }))
                }
                disabled={roomsLoading}
              >
                <SelectTrigger id="bulk-room">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" />
                Price
              </Label>
              <Input
                id="bulk-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Recurrence Type Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as RecurrenceType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Recurrence</TabsTrigger>
              <TabsTrigger value="custom">Custom Dates</TabsTrigger>
            </TabsList>

            {/* Daily Recurrence */}
            <TabsContent value="daily" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="start-date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dailyData.start_date}
                    onChange={(e) =>
                      setDailyData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dailyData.end_date}
                    onChange={(e) =>
                      setDailyData((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    min={
                      dailyData.start_date || format(new Date(), "yyyy-MM-dd")
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Time Slots (Daily)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimeSlot}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {dailyData.time_slots.map((slot) => (
                    <div key={slot.id} className="flex gap-2">
                      <Input
                        type="time"
                        value={slot.time}
                        onChange={(e) =>
                          handleTimeSlotChange(slot.id, e.target.value)
                        }
                        className="flex-1"
                      />
                      {dailyData.time_slots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTimeSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Custom Dates */}
            <TabsContent value="custom" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Custom Date & Time Combinations</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomDate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Date
                </Button>
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-3">
                  {customDates.map((custom) => (
                    <div key={custom.id} className="flex gap-2">
                      <Input
                        type="date"
                        value={custom.date}
                        onChange={(e) =>
                          handleCustomDateChange(
                            custom.id,
                            "date",
                            e.target.value
                          )
                        }
                        min={format(new Date(), "yyyy-MM-dd")}
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={custom.time}
                        onChange={(e) =>
                          handleCustomDateChange(
                            custom.id,
                            "time",
                            e.target.value
                          )
                        }
                        className="flex-1"
                      />
                      {customDates.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomDate(custom.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {showtimesPreview.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-amber-500">Preview</h4>
                <Badge variant="secondary">
                  {showtimesPreview.length} showtimes
                </Badge>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {showtimesPreview.map((showtime, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border bg-background p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {format(new Date(showtime.date), "MMM d, yyyy")}
                        </span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span>{showtime.time}</span>
                        {selectedMovie && (
                          <span className="ml-2 text-muted-foreground">
                            ({selectedMovie.runtime}min)
                          </span>
                        )}
                      </div>
                      <span className="font-medium">${formData.price}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createBulkShowtimes.isPending || showtimesPreview.length === 0
              }
              className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {createBulkShowtimes.isPending
                ? "Creating..."
                : `Create ${showtimesPreview.length} Showtimes`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
