'use client'

import { useState, useTransition } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { createOrgAndFirstEvent } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createOrgAndFirstEvent(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Set up your event</h1>
          <p className="text-sm text-muted-foreground">
            A few details to get your wedding gallery ready.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="orgName">Your name / studio name</Label>
            <Input
              id="orgName"
              name="orgName"
              placeholder="e.g. Emma & Jack, or Golden Hour Photography"
              required
              minLength={2}
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              This is the name of your account. Guests won't see it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupleNames">Couple's names</Label>
            <Input
              id="coupleNames"
              name="coupleNames"
              placeholder="e.g. Emma & Jack"
              required
              minLength={2}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventName">Event name</Label>
            <Input
              id="eventName"
              name="eventName"
              placeholder="e.g. Emma & Jack's Wedding"
              required
              minLength={2}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weddingDate">Wedding date (optional)</Label>
            <Input
              id="weddingDate"
              name="weddingDate"
              type="date"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create my gallery'}
          </Button>
        </form>
      </div>
    </div>
  )
}
