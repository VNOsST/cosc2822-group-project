/**
 * Server-Side API Client for TanStack Start SSR
 * This client works in both server and client contexts
 */

// Check if we're running on the server
const isServer = typeof window === 'undefined'

// Get API endpoint from environment
function getApiEndpoint(): string {
  if (isServer) {
    // On server, use process.env
    return process.env.VITE_API_ENDPOINT || 'http://localhost:3000'
  } else {
    // On client, use import.meta.env
    return import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000'
  }
}

// Helper to build full URL
function buildUrl(path: string, queryParams?: Record<string, string>): string {
  const baseUrl = getApiEndpoint()

  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // Ensure base URL ends with /
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  // Construct full URL
  const url = new URL(cleanPath, normalizedBase)

  // Add query parameters
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  return url.toString()
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ServerApiError'
  }
}

interface RequestOptions {
  queryParams?: Record<string, string>
  headers?: Record<string, string>
}

/**
 * Server-compatible API client for SSR loaders
 * Uses native fetch API which works in both server and client contexts
 */
export const serverApiClient = {
  get: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const url = buildUrl(path, options?.queryParams)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ServerAPI] Error response:`, errorText)
        let errorMessage = 'Request failed'
        try {
          const errorData = JSON.parse(errorText) as { error?: string }
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new ServerApiError(errorMessage, response.status)
      }

      const data = (await response.json()) as { data?: T; success?: boolean }
      return (data.data ?? data) as T
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error
      }
      console.error(`[ServerAPI] Unexpected error:`, error)
      throw new ServerApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
      )
    }
  },

  post: async <T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    const baseUrl = getApiEndpoint()
    const url = new URL(path, baseUrl)

    if (options?.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Request failed'
        try {
          const errorData = JSON.parse(errorText) as { error?: string }
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new ServerApiError(errorMessage, response.status)
      }

      const data = (await response.json()) as { data?: T; success?: boolean }
      return (data.data ?? data) as T
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error
      }
      throw new ServerApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
      )
    }
  },

  put: async <T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    const baseUrl = getApiEndpoint()
    const url = new URL(path, baseUrl)

    if (options?.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Request failed'
        try {
          const errorData = JSON.parse(errorText) as { error?: string }
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new ServerApiError(errorMessage, response.status)
      }

      const data = (await response.json()) as { data?: T; success?: boolean }
      return (data.data ?? data) as T
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error
      }
      throw new ServerApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
      )
    }
  },

  delete: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const baseUrl = getApiEndpoint()
    const url = new URL(path, baseUrl)

    if (options?.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Request failed'
        try {
          const errorData = JSON.parse(errorText) as { error?: string }
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new ServerApiError(errorMessage, response.status)
      }

      const data = (await response.json()) as { data?: T; success?: boolean }
      return (data.data ?? data) as T
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error
      }
      throw new ServerApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
      )
    }
  },
}
