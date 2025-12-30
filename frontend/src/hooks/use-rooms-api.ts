/**
 * Rooms API Hooks
 * TanStack Query hooks for rooms service endpoints
 */

import { useApiQuery, useApiMutation, useInvalidateQueries } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { Room } from "@/lib/api-types";

const QUERY_KEYS = {
  all: ["rooms"] as const,
  detail: (id: string) => ["rooms", id] as const,
};

// Queries
export function useRooms() {
  return useApiQuery<Room[]>([...QUERY_KEYS.all], "/rooms");
}

export function useRoom(id: string) {
  return useApiQuery<Room>([...QUERY_KEYS.detail(id)], `/rooms/${id}`, {
    enabled: !!id,
  });
}

// Mutations (Admin only - backend enforces this)
export function useCreateRoom() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation(
    (data: {
      name: string;
      capacity: number;
      screen_type: string;
      room_image_urls?: Array<string>;
      layout_config: {
        rows: number;
        columns: number;
      };
      unavailable?: Array<string>;
    }) => apiClient.post<Room>("/rooms", data),
    {
      onSuccess: () => invalidate([...QUERY_KEYS.all]),
    }
  );
}

export function useUpdateRoom() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation(
    ({ id, ...data }: Partial<Room> & { id: string }) =>
      apiClient.put<Room>(`/rooms/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        invalidate([...QUERY_KEYS.all]);
        invalidate([...QUERY_KEYS.detail(id)]);
      },
    }
  );
}

export function useDeleteRoom() {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation((id: string) => apiClient.delete(`/rooms/${id}`), {
    onSuccess: () => invalidate([...QUERY_KEYS.all]),
  });
}
