import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminSubscriptions,
  useSubscribeAdmin,
  useTestAdminNotification,
  useUnsubscribeAdmin,
} from '@/hooks/use-admin-notifications-api'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/notifications')({
  component: AdminNotificationsPage,
})

function AdminNotificationsPage() {
  const { user } = useAuth()

  const { data: subscriptions, isLoading, isError } = useAdminSubscriptions()
  const subscribeMutation = useSubscribeAdmin()
  const unsubscribeMutation = useUnsubscribeAdmin()
  const testMutation = useTestAdminNotification()

  const handleSubscribe = async () => {
    if (!user?.email) return

    try {
      await subscribeMutation.mutateAsync({ email: user.email })
      toast.success(
        'Subscription request sent! Please check your email to confirm.',
      )
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.')
    }
  }

  const handleUnsubscribe = async (subEmail: string) => {
    try {
      // Prefer email for unsubscribe as we implemented it in backend
      await unsubscribeMutation.mutateAsync({ email: subEmail })
      toast.success('Successfully unsubscribed.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to unsubscribe.')
    }
  }

  const handleTest = async () => {
    try {
      await testMutation.mutateAsync(undefined as any)
      toast.success('Test notification sent to all confirmed subscribers.')
    } catch (error) {
      toast.error('Failed to send test notification.')
    }
  }

  const isSubscribed = subscriptions?.some(
    (s) => s.email === user?.email && s.status === 'confirmed',
  )
  const isPending = subscriptions?.some(
    (s) => s.email === user?.email && s.status === 'pending',
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Notifications
        </h2>
        <p className="text-muted-foreground">
          Manage email subscriptions for system alerts (bookings, cancellations,
          etc.)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Mail className="h-5 w-5" />
              Subscribe to Alerts
            </CardTitle>
            <CardDescription>
              Subscribe your account email to receive real-time system alerts
              via SNS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your account email
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={
                  subscribeMutation.isPending ||
                  isSubscribed ||
                  isPending ||
                  !user?.email
                }
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubscribed
                  ? 'Already Subscribed'
                  : isPending
                    ? 'Pending Confirmation'
                    : 'Subscribe to Alerts'}
              </Button>

              {isPending && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Please check your inbox to confirm your subscription!
                  </span>
                </div>
              )}
              {isSubscribed && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>You are receiving alerts at this email.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Send className="h-5 w-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Send a test message to all confirmed subscribers to verify the
              system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="w-full"
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Send Test Notification'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Subscribers</CardTitle>
          <CardDescription>
            Active and pending email subscriptions for the admin alerts topic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="rounded-lg bg-destructive/10 p-8 text-center text-destructive">
              Failed to load subscriptions. Please try again.
            </div>
          ) : subscriptions?.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No active subscriptions found.
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">ARN</TableHead>
                    <TableHead className="text-right text-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.map((sub) => (
                    <TableRow
                      key={sub.subscriptionArn}
                      className="border-border"
                    >
                      <TableCell className="font-medium text-foreground">
                        {sub.email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sub.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                        {sub.subscriptionArn}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUnsubscribe(sub.email)}
                          disabled={unsubscribeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Configured Alerts</CardTitle>
          <CardDescription>
            The following events will trigger an email notification to all
            confirmed subscribers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'New Booking',
                desc: 'Sent when a user confirms a new ticket reservation.',
              },
              {
                title: 'Booking Cancelled',
                desc: 'Sent when a user cancels their booking within the 6h window.',
              },
              {
                title: 'User Registration',
                desc: 'Sent when a new user confirms their email address.',
              },
              {
                title: 'Low Seat Availability',
                desc: 'Triggered when a showtime reaches 80% capacity.',
              },
            ].map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
