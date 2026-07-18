'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function PinPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/e/${slug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      router.push(`/e/${slug}`)
      router.refresh()
    } else {
      toast.error('Incorrect PIN', { description: 'Please check your PIN and try again.' })
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Private event</p>
          <h1 className="font-serif text-heading">Enter the PIN</h1>
          <p className="text-sm text-muted-foreground">
            This gallery is protected. Enter the code shared by the couple.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="sr-only">PIN</Label>
            <Input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN"
              className="h-14 rounded-lg text-center font-mono text-2xl tracking-[0.3em] placeholder:font-sans placeholder:text-base placeholder:tracking-normal"
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading || pin.length < 4}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
