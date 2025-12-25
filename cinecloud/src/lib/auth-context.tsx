import { createContext, useContext, useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { signOut as amplifySignOut } from 'aws-amplify/auth/cognito'
import { Hub } from 'aws-amplify/utils'
import type { ReactNode } from 'react'

// Role types for access control
export type UserRole = 'unauthenticated' | 'Users' | 'Admins'

interface User {
  userId: string
  username: string
  email?: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkUser = async () => {
    try {
      const session = await fetchAuthSession()
      if (session.tokens) {
        const idToken = session.tokens.idToken
        
        // Extract Cognito groups from token to determine role
        const cognitoGroups = idToken?.payload['cognito:groups']
        const groups = Array.isArray(cognitoGroups) 
          ? (cognitoGroups as Array<string>) 
          : []
        const role: UserRole = groups.includes('Admins') ? 'Admins' : 'Users'
        
        setUser({
          userId: idToken?.payload.sub as string,
          username: (idToken?.payload['cognito:username'] as string) || 'User',
          email: idToken?.payload.email as string,
          role,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkUser()

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }: { payload: any }) => {
      switch (payload.event) {
        case 'signedIn':
          checkUser()
          break
        case 'signedOut':
          setUser(null)
          break
      }
    })

    return () => hubListener()
  }, [])

  const signOut = async () => {
    try {
      await amplifySignOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
