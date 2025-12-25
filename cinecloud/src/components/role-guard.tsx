import { Navigate, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { UserRole } from '@/lib/auth-context'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from '@/components/ui/spinner'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: Array<UserRole>
  fallbackPath?: string
}

/**
 * Route guard that checks if the current user has one of the allowed roles.
 * Redirects to fallbackPath if not authorized.
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = '/login',
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // If not authenticated and role requires auth
  if (!isAuthenticated && !allowedRoles.includes('unauthenticated')) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} />
  }

  // Check if user has required role
  const userRole: UserRole = user?.role ?? 'unauthenticated'
  if (!allowedRoles.includes(userRole)) {
    // User is authenticated but doesn't have required role
    if (userRole === 'Users') {
      // Regular users go to user home
      return <Navigate to="/user" />
    } else if (userRole === 'Admins') {
      // Admins go to admin dashboard
      return <Navigate to="/admin" />
    } else {
      // Unauthenticated go to login
      return <Navigate to={fallbackPath} search={{ redirect: location.pathname }} />
    }
  }

  return <>{children}</>
}
