import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  return <Navigate to="/login" />
}
