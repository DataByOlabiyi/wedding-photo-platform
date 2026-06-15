'use client'

import { useTransition } from 'react'
import { overrideOrgPlan } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  orgId: string
  currentPlan: 'starter' | 'pro'
}

export function PlanOverrideForm({ orgId, currentPlan }: Props) {
  const [isPending, startTransition] = useTransition()
  const targetPlan = currentPlan === 'pro' ? 'starter' : 'pro'

  const handleClick = () => {
    startTransition(async () => {
      const result = await overrideOrgPlan(orgId, targetPlan)
      if (result?.error) toast.error(result.error)
      else toast.success(`Plan set to ${targetPlan}`)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs"
      disabled={isPending}
      onClick={handleClick}
    >
      Set {targetPlan}
    </Button>
  )
}
