'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Lock, Loader2, Heart } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Enter PIN</h1>
          <p className="text-sm text-muted-foreground">
            This event is PIN-protected. Enter the code shared by the couple.
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
              placeholder="Enter PIN"
              className="text-center text-xl tracking-widest h-14 rounded-xl"
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full h-12" disabled={loading || pin.length < 4}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
