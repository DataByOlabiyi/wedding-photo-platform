'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password too short', { description: 'Minimum 8 characters.' })
      return
    }
    if (!agreedToTerms) {
      toast.error('Please accept the Terms of Service to continue.')
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation the user lands on /auth/callback which
        // redirects to /onboarding for org + event setup.
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error('Could not create account. Check your details and try again.')
      setLoading(false)
      return
    }

    toast.success('Check your email', {
      description: 'We sent you a confirmation link. Click it to activate your account.',
    })
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">SnapEvent</p>
          <h1 className="font-serif text-heading">Create your account</h1>
          <p className="text-sm text-muted-foreground">Your first gallery is a minute away.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{' '}
              <Link href="/legal/terms" className="text-primary underline underline-offset-4">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/legal/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>
            </label>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
