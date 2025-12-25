import { Navigate, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { UserRole } from '@/lib/auth-context'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
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

  // If a specific role is required, check for it
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate page based on actual role
    if (user?.role === 'Admins') {
      return <Navigate to="/dashboard" />
    }
    if (user?.role === 'Users') {
      return <Navigate to="/movies" />
    }
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
