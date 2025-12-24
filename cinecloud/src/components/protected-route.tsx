import { Navigate, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} />
  }

  return <>{children}</>
}
