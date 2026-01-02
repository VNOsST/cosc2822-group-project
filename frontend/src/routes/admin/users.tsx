import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { Shield, ShieldCheck, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateUserRole, useUsers } from '@/hooks/use-users-api'
import type { User, UserRole } from '@/lib/api-types'

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
})

function UsersPage() {
  const { data: users, isLoading } = useUsers()
  const updateRole = useUpdateUserRole()

  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean
    user: User | null
    newRole: UserRole | null
  }>({
    open: false,
    user: null,
    newRole: null,
  })

  const handleRoleChange = (user: User, newRole: UserRole) => {
    if (user.role === newRole) return

    setRoleChangeDialog({
      open: true,
      user,
      newRole,
    })
  }

  const confirmRoleChange = async () => {
    if (!roleChangeDialog.user || !roleChangeDialog.newRole) return

    try {
      await updateRole.mutateAsync({
        userId: roleChangeDialog.user.id,
        role: roleChangeDialog.newRole,
      })
      toast.success(
        `User role updated to ${roleChangeDialog.newRole} successfully`,
      )
      setRoleChangeDialog({ open: false, user: null, newRole: null })
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || 'Failed to update user role'
      toast.error(errorMessage)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    if (role === 'Admins') {
      return (
        <Badge variant="default" className="bg-blue-600">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Shield className="mr-1 h-3 w-3" />
        User
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            All Users
            <Badge variant="secondary">{users?.length || 0}</Badge>
            {isLoading && (
              <Badge variant="outline" className="ml-2">
                Loading...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user, value as UserRole)
                          }
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Users">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="Admins">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog
        open={roleChangeDialog.open}
        onOpenChange={(open) =>
          setRoleChangeDialog({ ...roleChangeDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change{' '}
              <strong>{roleChangeDialog.user?.name}</strong>'s role from{' '}
              <strong>{roleChangeDialog.user?.role}</strong> to{' '}
              <strong>{roleChangeDialog.newRole}</strong>?
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">User Details:</div>
                <div>Email: {roleChangeDialog.user?.email}</div>
                <div>
                  Current Role:{' '}
                  {getRoleBadge(roleChangeDialog.user?.role || 'Users')}
                </div>
                <div className="mt-2 text-muted-foreground">
                  This will update their Cognito group membership and grant or
                  revoke admin privileges.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateRole.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={updateRole.isPending}
            >
              {updateRole.isPending ? 'Updating...' : 'Confirm Change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

