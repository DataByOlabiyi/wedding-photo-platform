'use client'

import { useState } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/checkout', { method: 'POST' })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'Checkout unavailable')
      window.location.href = url
    } catch (err) {
      toast.error('Could not start checkout', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading} className="w-full gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      Upgrade to Pro
    </Button>
  )
}
