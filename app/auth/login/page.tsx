'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolvePostLoginRedirect } from '@/app/actions/post-login-redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Incorrect email or password.')
      setLoading(false)
      return
    }

    const destination = await resolvePostLoginRedirect()
    router.push(destination)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">SnapEvent</p>
          <h1 className="font-serif text-heading">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your event dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/auth/signup" className="text-primary underline underline-offset-4">
            Create one
          </Link>
        </p>
    </div>
  )
}
