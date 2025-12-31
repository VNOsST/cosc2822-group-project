/**
 * Authenticated API Client for CineCloud
 * Uses AWS Amplify's native REST API module for automatic authentication
 */

import { get, post, put, del } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API name as configured in Amplify
const API_NAME = 'CineCloudApi'

interface RequestOptions {
  queryParams?: Record<string, string>
  headers?: Record<string, string>
}

/**
 * Get authorization headers with JWT token if user is authenticated
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession()
    if (session.tokens?.idToken) {
      return {
        Authorization: `Bearer ${session.tokens.idToken.toString()}`,
      }
    }
  } catch {
    // User not authenticated, continue without auth header
  }
  return {}
}

/**
 * Parse the response body as JSON
 */
async function parseResponse<T>(response: {
  body: { json: () => Promise<unknown> }
}): Promise<T> {
  const data = (await response.body.json()) as {
    data?: T
    success?: boolean
    error?: string
  }
  return (data.data ?? data) as T
}

/**
 * Handle API errors
 */
function handleError(error: unknown): never {
  if (error instanceof Error && 'response' in error) {
    const apiError = error as {
      response?: { statusCode?: number; body?: string }
    }
    const status = apiError.response?.statusCode ?? 500
    let message = 'Request failed'

    try {
      if (apiError.response?.body) {
        const body = JSON.parse(apiError.response.body) as { error?: string }
        message = body.error ?? message
      }
    } catch {
      // Use default message
    }

    throw new ApiError(message, status)
  }
  throw error
}

/**
 * API Client using Amplify's native REST module
 *
 * @example
 * // GET request
 * const movies = await apiClient.get<Movie[]>('/movies')
 *
 * // POST with body
 * const movie = await apiClient.post<Movie>('/movies', { title: 'Inception' })
 *
 * // With query parameters
 * const results = await apiClient.get<Movie[]>('/movies/search', {
 *   queryParams: { q: 'action' }
 * })
 */
export const apiClient = {
  get: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    try {
      const authHeaders = await getAuthHeaders()
      const restOperation = get({
        apiName: API_NAME,
        path,
        options: {
          queryParams: options?.queryParams,
          headers: { ...authHeaders, ...options?.headers },
        },
      })
      const response = await restOperation.response
      return parseResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  },

  post: async <T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    try {
      const authHeaders = await getAuthHeaders()
      const restOperation = post({
        apiName: API_NAME,
        path,
        options: {
          body: body as FormData,
          queryParams: options?.queryParams,
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders, 
            ...options?.headers 
          },
        },
      })
      const response = await restOperation.response
      return parseResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  },

  put: async <T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    try {
      const authHeaders = await getAuthHeaders()
      const restOperation = put({
        apiName: API_NAME,
        path,
        options: {
          body: body as FormData,
          queryParams: options?.queryParams,
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders, 
            ...options?.headers 
          },
        },
      })
      const response = await restOperation.response
      return parseResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  },

  patch: async <T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    // Amplify doesn't have a native patch, using put as workaround
    return apiClient.put<T>(path, body, options)
  },

  delete: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    try {
      const authHeaders = await getAuthHeaders()
      const restOperation = del({
        apiName: API_NAME,
        path,
        options: {
          queryParams: options?.queryParams,
          headers: { ...authHeaders, ...options?.headers },
        },
      })
      const response = await restOperation.response
      return parseResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  },
}

// Legacy function for backwards compatibility
export async function api<T>(
  endpoint: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET'

  switch (method) {
    case 'POST':
      return apiClient.post<T>(endpoint, options?.body)
    case 'PUT':
      return apiClient.put<T>(endpoint, options?.body)
    case 'DELETE':
      return apiClient.delete<T>(endpoint)
    default:
      return apiClient.get<T>(endpoint)
  }
}
