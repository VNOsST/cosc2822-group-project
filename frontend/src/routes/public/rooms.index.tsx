import { Link, createFileRoute } from '@tanstack/react-router'
import { Users, Monitor } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import { ErrorState } from '@/components/error-state'
import { serverApiClient } from '@/lib/server-api-client'
import type { Room } from '@/lib/api-types'

export const Route = createFileRoute('/public/rooms/')({
  ssr: 'data-only',
  loader: async () => {
    try {
      const rooms = await serverApiClient.get<Array<Room>>('/rooms')
      return { rooms, error: null }
    } catch (error) {
      console.error('Failed to load rooms on server:', error)
      return {
        rooms: [],
        error: error instanceof Error ? error.message : 'Failed to load rooms',
      }
    }
  },
  component: PublicRoomsPage,
})

function PublicRoomsPage() {
  const { rooms, error } = Route.useLoaderData()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Our Cinema Rooms
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Explore our state-of-the-art screening rooms
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to Load Rooms"
          message={error}
          actionLabel="Refresh Page"
          onAction={() => window.location.reload()}
        />
      )}

      {/* Rooms Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room) => (
          <Card
            key={room.room_id}
            className="group overflow-hidden border-slate-700/50 bg-slate-800/50 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="relative aspect-video overflow-hidden">
              {room.room_image_urls && room.room_image_urls.length > 0 ? (
                <RemoteImage
                  src={room.room_image_urls[0]}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-700">
                  <Monitor className="h-16 w-16 text-slate-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
              <Badge className="absolute right-2 top-2 bg-amber-500 text-slate-900">
                {room.screen_type}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="mb-2 text-lg font-semibold text-white">
                {room.name}
              </h3>
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                <Users className="h-4 w-4" />
                <span>Capacity: {room.capacity} seats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="font-medium">Layout:</span>{' '}
                  {room.layout_config.rows} × {room.layout_config.columns}
                </div>
                <div>
                  <span className="font-medium">Images:</span>{' '}
                  {room.room_image_urls?.length || 0}
                </div>
              </div>
              <Link
                to="/public/rooms/$id"
                params={{ id: room.room_id }}
                className="mt-4 block"
              >
                <Button
                  size="sm"
                  className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                >
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {!error && rooms?.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg text-slate-400">
            No rooms available at the moment
          </p>
        </div>
      )}
    </div>
  )
}
