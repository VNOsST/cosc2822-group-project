import { Navigate, createFileRoute, useSearch } from '@tanstack/react-router'
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
})

const amplifyTheme = {
  name: 'cinecloud-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: '#fef3c7' },
          20: { value: '#fde68a' },
          40: { value: '#fcd34d' },
          60: { value: '#fbbf24' },
          80: { value: '#f59e0b' },
          90: { value: '#d97706' },
          100: { value: '#b45309' },
        },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: { value: '0' },
          boxShadow: { value: 'none' },
        },
      },
    },
  },
}

function LoginPage() {
  const { isAuthenticated } = useAuth()
  const { redirect } = useSearch({ from: '/login' })

  if (isAuthenticated) {
    return <Navigate to={redirect || '/dashboard'} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              CineCloud
            </span>
          </h1>
          <p className="mt-2 text-slate-400">Admin Dashboard</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-lg">
          <ThemeProvider theme={amplifyTheme}>
            <Authenticator hideSignUp={false} signUpAttributes={['email']}>
              {() => <Navigate to={redirect || '/dashboard'} />}
            </Authenticator>
          </ThemeProvider>
        </div>
      </div>
    </div>
  )
}
