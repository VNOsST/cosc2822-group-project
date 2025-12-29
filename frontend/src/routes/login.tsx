import { Navigate, createFileRoute, useSearch } from '@tanstack/react-router'
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth'
import {
  CheckCircle2,
  Clapperboard,
  Film,
  Loader2,
  Lock,
  Phone,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
})

type LoginTabsView = 'signin' | 'signup' | 'confirm' | 'forgot'

function LoginPage() {
  const { isAuthenticated } = useAuth()
  const { redirect } = useSearch({ from: '/login' })
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<LoginTabsView>('signin')

  // Form states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  if (isAuthenticated) {
    return <Navigate to={redirect || '/'} />
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn({ username, password })
      toast.success('Successfully signed in!')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate phone number format (E.164 format required by AWS Cognito)
    if (!phone.startsWith('+')) {
      toast.error(
        'Phone number must start with + and country code (e.g., +1234567890)',
      )
      setLoading(false)
      return
    }

    // Remove any spaces, dashes, or parentheses from phone number
    const formattedPhone = phone.replace(/[\s\-()]/g, '')

    try {
      await signUp({
        username: email, // Use email as username
        password,
        options: {
          userAttributes: {
            email,
            phone_number: formattedPhone,
            name, // Required by Cognito user pool schema
          },
        },
      })
      toast.success(
        'Sign up successful! Please check your email for the verification code.',
      )
      setView('confirm')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await confirmSignUp({
        username: email, // Use email as username
        confirmationCode: code,
      })
      toast.success('Account confirmed! You can now sign in.')
      setView('signin')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to confirm account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020617] flex items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-amber-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-orange-600/10 rounded-full blur-[128px] animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-100">
        {/* Logo Section */}
        <div className="mb-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-amber-400 to-orange-600 mb-4 shadow-lg shadow-amber-500/20">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="bg-linear-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              CineCloud
            </span>
          </h1>
          <p className="text-slate-400 font-medium">
            Elevating your cinema management
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-2xl shadow-2xl">
          <Tabs
            value={view === 'signup' ? 'signup' : 'signin'}
            onValueChange={(v) => setView(v as LoginTabsView)}
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold text-white">
                  {view === 'signin' && 'Welcome Back'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'confirm' && 'Verify Email'}
                </CardTitle>
                {view !== 'confirm' && (
                  <TabsList className="bg-slate-800/50 text-white">
                    <TabsTrigger
                      value="signin"
                      className="data-[state=active]:bg-slate-700 text-xs font-medium text-white hover:cursor-pointer"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-slate-700 text-xs font-medium text-white hover:cursor-pointer"
                    >
                      Join
                    </TabsTrigger>
                  </TabsList>
                )}
              </div>
              <CardDescription className="text-slate-400">
                {view === 'signin' && 'Sign in with your email and password'}
                {view === 'signup' &&
                  'Create your account with your name, email, phone, and password'}
                {view === 'confirm' && `Sent a verification code to ${email}`}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {view === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-200">
                      Email
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="username"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-amber-500/50"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-200">
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-amber-500 hover:text-amber-400"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-amber-500/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-6 shadow-lg shadow-amber-500/20"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              )}

              {view === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-200">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Include country code (e.g., +1 for US, +84 for Vietnam)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-slate-200">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="reg-password"
                        type="password"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-6 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              )}

              {view === 'confirm' && (
                <form onSubmit={handleConfirmSignUp} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-slate-200">
                      Verification Code
                    </Label>
                    <Input
                      id="code"
                      placeholder="Enter 6-digit code"
                      className="text-center tracking-widest text-lg bg-slate-800/50 border-slate-700 text-white"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Confirm Account
                      </div>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => setView('signup')}
                  >
                    Back to Sign Up
                  </Button>
                </form>
              )}
            </CardContent>

            {view !== 'confirm' && (
              <CardFooter className="flex flex-col space-y-4 border-t border-slate-800 pt-6 mt-2">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0f172a] px-2 text-slate-500">
                      Trusted by CineCloud
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Clapperboard className="w-4 h-4" />
                  <span>Secured by AWS Cognito</span>
                </div>
              </CardFooter>
            )}
          </Tabs>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} CineCloud Inc. All rights reserved.
        </p>
      </div>
    </div>
  )
}
