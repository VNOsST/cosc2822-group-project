/**
 * Seat Selection & Booking Page
 * Interactive seat map with temporary locking during checkout
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Clock,
    Loader2,
    MapPin,
    ShoppingCart,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SeatMap } from "@/components/bookings/seat-map";
import { CountdownTimer } from "@/components/bookings/countdown-timer";
import { useShowtime } from "@/hooks/use-showtimes-api";
import {
    useExtendLocks,
    useLockSeats,
    useSeatStatus,
    useUnlockSeats,
} from "@/hooks/use-seat-locks-api";
import { useCreateBooking } from "@/hooks/use-bookings-api";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import type { SeatLockResponse } from "@/lib/api-types";

export const Route = createFileRoute("/user/book/$id")({
    component: BookingPage,
});

const MAX_SEATS = 10; // Maximum seats per booking

function BookingPage() {
    const navigate = useNavigate();
    const { id: showtimeId } = Route.useParams();
    const { user } = useAuth();

    // State
    const [selectedSeats, setSelectedSeats] = useState<Array<string>>([]);
    const [lockInfo, setLockInfo] = useState<SeatLockResponse | null>(null);
    const [isLocking, setIsLocking] = useState(false);

    // Queries
    const {
        data: showtime,
        isLoading: showtimeLoading,
        error: showtimeError,
    } = useShowtime(showtimeId);
    const { data: seatStatus, refetch: refetchSeatStatus } =
        useSeatStatus(showtimeId);

    // Mutations
    const lockSeats = useLockSeats();
    const unlockSeats = useUnlockSeats();
    const extendLocks = useExtendLocks();
    const createBooking = useCreateBooking();

    const movie = showtime?.movie;
    const room = showtime?.room;

    // Cleanup locks on unmount
    useEffect(() => {
        return () => {
            if (lockInfo && selectedSeats.length > 0) {
                unlockSeats.mutate({
                    showtime_id: showtimeId,
                    seats: selectedSeats,
                    lock_id: lockInfo.lock_id,
                });
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle seat selection
    const handleSeatClick = useCallback((seatId: string) => {
        setSelectedSeats((prev) => {
            if (prev.includes(seatId)) {
                return prev.filter((s) => s !== seatId);
            }
            if (prev.length >= MAX_SEATS) {
                toast.error(`Maximum ${MAX_SEATS} seats per booking`);
                return prev;
            }
            return [...prev, seatId];
        });
    }, []);

    // Lock selected seats
    const handleLockSeats = async () => {
        if (selectedSeats.length === 0) {
            toast.error("Please select at least one seat");
            return;
        }

        setIsLocking(true);
        try {
            const result = await lockSeats.mutateAsync({
                showtime_id: showtimeId,
                seats: selectedSeats,
            });
            setLockInfo(result);
            toast.success("Seats locked for 10 minutes");
            refetchSeatStatus();
        } catch (error: any) {
            const message = error?.message || "Failed to lock seats";
            toast.error(message);
            // Refresh seat status to show which seats are now locked
            refetchSeatStatus();
        } finally {
            setIsLocking(false);
        }
    };

    // Extend lock duration
    const handleExtendLock = async () => {
        if (!lockInfo) return;

        try {
            const result = await extendLocks.mutateAsync({
                showtime_id: showtimeId,
                seats: selectedSeats,
                lock_id: lockInfo.lock_id,
            });
            if (result.expires_at) {
                setLockInfo((prev) =>
                    prev ? { ...prev, expires_at: result.expires_at! } : null
                );
                toast.success("Lock extended for another 10 minutes");
            }
        } catch (error) {
            toast.error("Failed to extend lock");
        }
    };

    // Handle lock expiration
    const handleLockExpired = () => {
        setLockInfo(null);
        toast.error("Your seat lock has expired. Please select seats again.");
        refetchSeatStatus();
    };

    // Confirm booking
    const handleConfirmBooking = async () => {
        if (!user || !showtime || !lockInfo) return;

        try {
            await createBooking.mutateAsync({
                user_email: user.email!,
                user_id: user.userId,
                showtime_id: showtimeId,
                movie_id: showtime.movie_id,
                seats: selectedSeats,
                total_amount: selectedSeats.length * showtime.price,
                lock_id: lockInfo.lock_id,
            });

            toast.success("Booking confirmed!");
            navigate({ to: "/user/bookings" });
        } catch (error: any) {
            const message = error?.message || "Failed to create booking";
            toast.error(message);
        }
    };

    // Cancel and release locks
    const handleCancel = async () => {
        if (lockInfo) {
            await unlockSeats.mutateAsync({
                showtime_id: showtimeId,
                seats: selectedSeats,
                lock_id: lockInfo.lock_id,
            });
        }
        navigate({ to: "/public/showtimes/$id", params: { id: showtimeId } });
    };

    // Loading state
    if (showtimeLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    // Error state
    if (showtimeError || !showtime || !room) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate({ to: "/public/showtimes" })}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Showtimes
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load showtime details. Please try again.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const startTime = new Date(showtime.start_time);
    const totalPrice = selectedSeats.length * showtime.price;
    const lockedByOthers =
        seatStatus?.locked_seats
            .filter((l) => !selectedSeats.includes(l.seat_id))
            .map((l) => l.seat_id) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                </Button>

                {lockInfo && (
                    <CountdownTimer
                        expiresAt={lockInfo.expires_at}
                        onExpire={handleLockExpired}
                        onWarning={() =>
                            toast.warning("Less than 2 minutes remaining!")
                        }
                    />
                )}
            </div>

            {/* Page Title */}
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                    {movie?.title}
                </h1>
                <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {startTime.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {startTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {room.name}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Seat Map */}
                <div className="lg:col-span-2">
                    <Card className="border-slate-700/50 bg-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">
                                Select Your Seats
                            </CardTitle>
                            <p className="text-sm text-slate-400">
                                Select up to {MAX_SEATS} seats. Click to
                                select/deselect.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <SeatMap
                                room={room}
                                occupiedSeats={
                                    seatStatus?.occupied_seats ||
                                    showtime.occupied_seats
                                }
                                lockedSeats={lockedByOthers}
                                selectedSeats={selectedSeats}
                                onSeatClick={handleSeatClick}
                                disabled={!!lockInfo}
                                maxSeats={MAX_SEATS}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-4 border-amber-500/30 bg-slate-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg text-white">
                                <ShoppingCart className="h-5 w-5" />
                                Booking Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Selected Seats */}
                            <div>
                                <p className="text-sm text-slate-400">
                                    Selected Seats
                                </p>
                                {selectedSeats.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedSeats.sort().map((seat) => (
                                            <Badge
                                                key={seat}
                                                variant="outline"
                                                className="border-amber-500/50 text-amber-400"
                                            >
                                                {seat}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-slate-500">
                                        No seats selected
                                    </p>
                                )}
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 border-t border-slate-700 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">
                                        {selectedSeats.length} ×{" "}
                                        {formatCurrency(showtime.price)}
                                    </span>
                                    <span className="text-white">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold">
                                    <span className="text-slate-300">
                                        Total
                                    </span>
                                    <span className="text-amber-400">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-2">
                                {!lockInfo ? (
                                    <Button
                                        onClick={handleLockSeats}
                                        disabled={
                                            selectedSeats.length === 0 ||
                                            isLocking
                                        }
                                        className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                                    >
                                        {isLocking ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Locking Seats...
                                            </>
                                        ) : (
                                            <>
                                                <Users className="mr-2 h-4 w-4" />
                                                Lock Seats & Proceed
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleConfirmBooking}
                                            disabled={createBooking.isPending}
                                            className="w-full bg-green-500 text-white hover:bg-green-400"
                                        >
                                            {createBooking.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Confirming...
                                                </>
                                            ) : (
                                                "Confirm Booking"
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={handleExtendLock}
                                            disabled={extendLocks.isPending}
                                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                                        >
                                            Extend Lock Time
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Info */}
                            {lockInfo && (
                                <p className="text-center text-xs text-slate-500">
                                    Your seats are reserved for 10 minutes.
                                    Complete your booking before the timer
                                    expires.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
