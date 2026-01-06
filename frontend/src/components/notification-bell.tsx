import { Link } from '@tanstack/react-router'
import { Bell, Check, MessageSquare, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  useDeleteNotification,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/hooks/use-notifications-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export function NotificationBell() {
  const { data: notifications, isLoading } = useNotifications()
  const markReadMutation = useMarkNotificationAsRead()
  const deleteMutation = useDeleteNotification()

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    markReadMutation.mutate(id)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    deleteMutation.mutate(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-300 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-slate-900 border-white/10 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4 bg-slate-900/50">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-amber-500 font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-amber-500"></div>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-slate-400">
              <Bell className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex flex-col gap-1 p-4 transition-colors hover:bg-white/5 ${!notification.read ? 'bg-amber-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.type === 'rating_prompt' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}
                      >
                        {notification.type === 'rating_prompt' ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p
                          className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'text-slate-300'}`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.sent_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {notification.type === 'rating_prompt' &&
                    notification.metadata?.movie_id && (
                      <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 text-amber-500 text-xs justify-start hover:text-amber-400"
                      >
                        <Link
                          to="/public/movies/$id"
                          params={{ id: notification.metadata.movie_id }}
                        >
                          Leave a review
                        </Link>
                      </Button>
                    )}

                  <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] text-slate-400 hover:text-white"
                        onClick={(e) => handleMarkRead(e, notification.id)}
                        disabled={markReadMutation.isPending}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Mark as read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] text-slate-400 hover:text-destructive"
                      onClick={(e) => handleDelete(e, notification.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
