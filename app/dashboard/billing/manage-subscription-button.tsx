'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'Portal unavailable')
      window.location.href = url
    } catch (err) {
      toast.error('Could not open billing portal', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={loading} className="w-full gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      Manage subscription
    </Button>
  )
}
