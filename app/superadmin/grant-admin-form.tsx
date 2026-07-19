'use client'

import { useState, useTransition } from 'react'
import { grantPlatformAdmin } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function GrantAdminForm() {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await grantPlatformAdmin(email)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Admin access granted')
        setEmail('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@example.com"
        required
        className="flex-1 h-10"
      />
      <Button type="submit" className="shrink-0 h-10" disabled={isPending}>
        Grant admin
      </Button>
    </form>
  )
}
