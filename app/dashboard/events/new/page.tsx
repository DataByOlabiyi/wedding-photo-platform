'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createEvent } from '@/app/actions/event-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewEventPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEvent(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="max-w-lg space-y-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard" className="-ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Events</p>
        </div>
        <h1 className="font-serif text-heading">New event</h1>
        <p className="text-body text-muted-foreground">Create a new wedding gallery for your guests.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="eventName">Event name</Label>
          <Input id="eventName" name="eventName" placeholder="Emma & Jack's Wedding" required minLength={2} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupleNames">Couple's names</Label>
          <Input id="coupleNames" name="coupleNames" placeholder="Emma & Jack" required minLength={2} maxLength={120} />
          <p className="text-xs text-muted-foreground">Used to generate the guest upload link.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weddingDate">Wedding date (optional)</Label>
          <Input id="weddingDate" name="weddingDate" type="date" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create event'}
        </Button>
      </form>
    </div>
  )
}
