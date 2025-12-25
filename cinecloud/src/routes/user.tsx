import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/protected-route'
import { UserSidebar } from '@/components/user-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/user')({
  component: UserLayout,
})

function UserLayout() {
  return (
    <ProtectedRoute requiredRole="Users">
      <SidebarProvider>
        <UserSidebar />
        <SidebarInset className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
