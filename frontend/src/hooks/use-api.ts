/**
 * TanStack Query API Hooks
 * Base hooks for integrating Amplify API client with React Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApiError, apiClient } from "@/lib/api-client";
import type {
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Generic query hook factory
 *
 * @example
 * const { data, isLoading } = useApiQuery(['movies'], '/movies')
 */
export function useApiQuery<T>(
  queryKey: Array<string>,
  endpoint: string,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    ...options,
  });
}

/**
 * Generic mutation hook factory
 *
 * @example
 * const { mutate, isPending } = useApiMutation(
 *   (data) => apiClient.post('/movies', data),
 *   { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movies'] }) }
 * )
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, "mutationFn">
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...options,
  });
}

/**
 * Hook to invalidate queries after mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidate: (queryKey: Array<string>) =>
      queryClient.invalidateQueries({ queryKey }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
