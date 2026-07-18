'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      toast.error('Could not send reset email', { description: error.message })
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">SnapEvent</p>
            <h1 className="font-serif text-heading">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <strong>{email}</strong>. Click the link in your email to set a new password.
            </p>
          </div>
          <div className="text-center">
            <Link href="/auth/login">
              <Button variant="outline" className="h-11">
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">SnapEvent</p>
          <h1 className="font-serif text-heading">Reset your password</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
          </Button>
        </form>

        <p className="text-center">
          <Link href="/auth/login" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
