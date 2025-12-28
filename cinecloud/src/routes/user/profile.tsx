import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Mail, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

export const Route = createFileRoute('/user/profile')({
  component: UserProfilePage,
})

function UserProfilePage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-slate-400">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-700/50 bg-slate-800/50">
        <CardHeader className="text-center">
          <Avatar className="mx-auto h-24 w-24">
            <AvatarFallback className="bg-amber-500/20 text-3xl text-amber-500">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-2xl text-white">
            {user?.username}
          </CardTitle>
          <p className="text-slate-400">{user?.email}</p>
        </CardHeader>
      </Card>

      {/* Account Info */}
      <Card className="border-slate-700/50 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-amber-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              value={user?.username ?? ''}
              disabled
              className="border-slate-600 bg-slate-700/50 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <Input
                id="email"
                value={user?.email ?? ''}
                disabled
                className="border-slate-600 bg-slate-700/50 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Member Since</Label>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>December 2024</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-slate-700/50 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
