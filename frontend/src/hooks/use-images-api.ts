import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const QUERY_KEYS = {
  batch: (keys: Array<string>) => ['images', 'batch', ...keys] as const,
}

interface UploadUrlResponse {
  uploadUrl: string
  key: string
}

interface BatchImagesResponse {
  [key: string]: string
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({
      file,
      folder,
    }: {
      file: File
      folder: 'movies' | 'reviews' | 'rooms'
    }) => {
      // 1. Get pre-signed URL
      const { uploadUrl, key } = await apiClient.post<UploadUrlResponse>(
        '/images/upload-url',
        {
          folder,
          contentType: file.type,
        },
      )

      // 2. Upload to S3
      // We use standard fetch here because we don't want the API client's headers (Auth, etc.)
      // interfering with the S3 signature
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to upload image to storage')
      }

      return key
    },
  })
}

export function useDeleteImage() {
  return useMutation({
    mutationFn: async (key: string) => {
      if (!key) return
      return apiClient.delete(`/images/${key}`)
    },
  })
}

interface BatchDeleteResponse {
  succeeded: Array<string>
  failed: Array<string>
}

export function useDeleteImages() {
  return useMutation({
    mutationFn: async (keys: Array<string>) => {
      if (!keys || keys.length === 0) return { succeeded: [], failed: [] }

      // Filter out empty keys and HTTP URLs (external images we don't own)
      const validKeys = keys.filter((key) => key && !key.startsWith('http'))
      if (validKeys.length === 0) return { succeeded: [], failed: [] }

      return apiClient.post<BatchDeleteResponse>('/images/batch-delete', {
        keys: validKeys,
      })
    },
  })
}

export function useImages(keys: Array<string> = []) {
  return useQuery({
    queryKey: QUERY_KEYS.batch(keys),
    queryFn: async () => {
      if (keys.length === 0) return {}
      return apiClient.post<BatchImagesResponse>('/images/batch', { keys })
    },
    enabled: keys.length > 0,
    staleTime: 1000 * 60 * 55, // 55 minutes (URLs expire in 1 hour)
  })
}

// Helper hook for a single image
export function useImage(key?: string) {
  const { data } = useImages(key ? [key] : [])
  return data?.[key ?? '']
}
