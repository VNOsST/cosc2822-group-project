/**
 * Seat Locks API Hooks
 * TanStack Query hooks for seat locks service endpoints
 */

import { useApiMutation, useApiQuery } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type {
    MyLocksResponse,
    SeatLockResponse,
    SeatStatusResponse,
} from "@/lib/api-types";

const QUERY_KEYS = {
    showtime: (showtimeId: string) =>
        ["seat-locks", "showtime", showtimeId] as const,
    myLocks: (showtimeId: string) =>
        ["seat-locks", "my-locks", showtimeId] as const,
};

// Queries
export function useSeatStatus(showtimeId: string) {
    return useApiQuery<SeatStatusResponse>(
        [...QUERY_KEYS.showtime(showtimeId)],
        `/seat-locks/showtime/${showtimeId}`,
        {
            enabled: !!showtimeId,
            refetchInterval: 10000, // Refresh every 10 seconds to get updated lock status
            staleTime: 5000, // Consider data stale after 5 seconds
        }
    );
}

export function useMyLocks(showtimeId: string) {
    return useApiQuery<MyLocksResponse>(
        [...QUERY_KEYS.myLocks(showtimeId)],
        `/seat-locks/my-locks/${showtimeId}`,
        {
            enabled: !!showtimeId,
            refetchInterval: 30000, // Refresh every 30 seconds
        }
    );
}

// Mutations
export function useLockSeats() {
    return useApiMutation(
        (data: { showtime_id: string; seats: Array<string> }) =>
            apiClient.post<SeatLockResponse>("/seat-locks/lock", data)
    );
}

export function useUnlockSeats() {
    return useApiMutation(
        (data: {
            showtime_id: string;
            seats: Array<string>;
            lock_id?: string;
        }) =>
            apiClient.post<{ unlocked: Array<string>; failed: Array<string> }>(
                "/seat-locks/unlock",
                data
            )
    );
}

export function useExtendLocks() {
    return useApiMutation(
        (data: {
            showtime_id: string;
            seats: Array<string>;
            lock_id: string;
        }) =>
            apiClient.post<{
                extended: Array<string>;
                failed: Array<string>;
                expires_at: number | null;
                ttl_seconds: number;
            }>("/seat-locks/extend", data)
    );
}

export function useValidateLocks() {
    return useApiMutation(
        (data: {
            showtime_id: string;
            seats: Array<string>;
            lock_id: string;
        }) =>
            apiClient.post<{ valid: boolean; seats: Array<string> }>(
                "/seat-locks/validate",
                data
            )
    );
}
