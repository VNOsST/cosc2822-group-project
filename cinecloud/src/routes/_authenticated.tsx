import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/protected-route'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
