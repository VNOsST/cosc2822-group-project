/**
 * Interactive Seat Map Component
 * Visual representation of theater room layout with seat selection
 */

import { cn } from "@/lib/utils";
import type { Room } from "@/lib/api-types";

export type SeatStatus =
    | "available"
    | "occupied"
    | "locked"
    | "selected"
    | "unavailable";

interface SeatMapProps {
    room: Room;
    occupiedSeats: Array<string>;
    lockedSeats: Array<string>;
    selectedSeats: Array<string>;
    onSeatClick: (seatId: string) => void;
    disabled?: boolean;
    maxSeats?: number;
}

// Generate seat ID from row and column (e.g., "A1", "B2")
function getSeatId(row: number, col: number): string {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C, ...
    return `${rowLetter}${col + 1}`;
}

// Get the status of a seat
function getSeatStatus(
    seatId: string,
    occupiedSeats: Set<string>,
    lockedSeats: Set<string>,
    selectedSeats: Set<string>,
    unavailableSeats: Set<string>
): SeatStatus {
    if (unavailableSeats.has(seatId)) return "unavailable";
    if (occupiedSeats.has(seatId)) return "occupied";
    if (selectedSeats.has(seatId)) return "selected";
    if (lockedSeats.has(seatId)) return "locked";
    return "available";
}

// Get styles for each seat status
function getSeatStyles(status: SeatStatus): string {
    const baseStyles =
        "w-8 h-8 rounded-t-lg text-xs font-medium transition-all duration-200 flex items-center justify-center";

    switch (status) {
        case "available":
            return cn(
                baseStyles,
                "bg-slate-600 hover:bg-amber-500 hover:text-slate-900 cursor-pointer text-slate-300"
            );
        case "occupied":
            return cn(
                baseStyles,
                "bg-red-500/50 text-red-200 cursor-not-allowed"
            );
        case "locked":
            return cn(
                baseStyles,
                "bg-orange-500/50 text-orange-200 cursor-not-allowed"
            );
        case "selected":
            return cn(
                baseStyles,
                "bg-amber-500 text-slate-900 ring-2 ring-amber-300 cursor-pointer"
            );
        case "unavailable":
            return cn(
                baseStyles,
                "bg-slate-800 text-slate-600 cursor-not-allowed"
            );
        default:
            return baseStyles;
    }
}

export function SeatMap({
    room,
    occupiedSeats,
    lockedSeats,
    selectedSeats,
    onSeatClick,
    disabled = false,
    maxSeats = 10,
}: SeatMapProps) {
    const { rows, columns } = room.layout_config;
    const occupiedSet = new Set(occupiedSeats);
    const lockedSet = new Set(lockedSeats);
    const selectedSet = new Set(selectedSeats);
    const unavailableSet = new Set(room.unavailable || []);

    const handleSeatClick = (seatId: string, status: SeatStatus) => {
        if (disabled) return;
        if (
            status === "occupied" ||
            status === "locked" ||
            status === "unavailable"
        )
            return;

        // Check max seats limit when selecting a new seat
        if (status === "available" && selectedSeats.length >= maxSeats) {
            return; // Don't allow more than maxSeats
        }

        onSeatClick(seatId);
    };

    return (
        <div className="space-y-6">
            {/* Screen */}
            <div className="relative">
                <div className="mx-auto h-2 w-3/4 rounded-b-full bg-linear-to-b from-amber-500/50 to-transparent" />
                <p className="mt-2 text-center text-xs text-slate-500">
                    SCREEN
                </p>
            </div>

            {/* Seat Grid */}
            <div className="flex flex-col items-center gap-2">
                {Array.from({ length: rows }, (_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-1">
                        {/* Row Label */}
                        <span className="w-6 text-center text-xs font-medium text-slate-500">
                            {String.fromCharCode(65 + rowIndex)}
                        </span>

                        {/* Seats */}
                        <div className="flex gap-1">
                            {Array.from({ length: columns }, (_, colIndex) => {
                                const seatId = getSeatId(rowIndex, colIndex);
                                const status = getSeatStatus(
                                    seatId,
                                    occupiedSet,
                                    lockedSet,
                                    selectedSet,
                                    unavailableSet
                                );

                                return (
                                    <button
                                        key={seatId}
                                        onClick={() =>
                                            handleSeatClick(seatId, status)
                                        }
                                        disabled={
                                            disabled ||
                                            status === "occupied" ||
                                            status === "locked" ||
                                            status === "unavailable"
                                        }
                                        className={getSeatStyles(status)}
                                        title={`Seat ${seatId} - ${status}`}
                                    >
                                        {colIndex + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Row Label (right side) */}
                        <span className="w-6 text-center text-xs font-medium text-slate-500">
                            {String.fromCharCode(65 + rowIndex)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-t-sm bg-slate-600" />
                    <span className="text-slate-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-t-sm bg-amber-500" />
                    <span className="text-slate-400">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-t-sm bg-orange-500/50" />
                    <span className="text-slate-400">Locked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-t-sm bg-red-500/50" />
                    <span className="text-slate-400">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-t-sm bg-slate-800" />
                    <span className="text-slate-400">Unavailable</span>
                </div>
            </div>
        </div>
    );
}
