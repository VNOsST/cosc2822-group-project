import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { user, isLoading } = useAuth()


  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  // Role-based redirect
  if (user?.role === 'Admins') {
    return <Navigate to="/admin/dashboard" />
  }
  
  if (user?.role === 'Users') {
    return <Navigate to="/public/movies" />
  }

  // Unauthenticated users go to public movies page
  return <Navigate to="/public/movies" />
}
