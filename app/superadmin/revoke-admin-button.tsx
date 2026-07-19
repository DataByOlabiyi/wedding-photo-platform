'use client'

import { useTransition } from 'react'
import { revokePlatformAdmin } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function RevokeAdminButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await revokePlatformAdmin(userId)
      if (result?.error) toast.error(result.error)
      else toast.success('Admin access revoked')
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={isPending}
      onClick={handleClick}
    >
      Revoke
    </Button>
  )
}
