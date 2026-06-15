import { requireOrg } from '@/lib/auth'
import { PLANS } from '@/lib/stripe'
import { CheckCircle2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UpgradeButton } from './upgrade-button'

export default async function BillingPage() {
  const { membership } = await requireOrg()
  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations as { plan: string } | null

  const currentPlan = (org?.plan ?? 'starter') as 'starter' | 'pro'

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Billing & plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current plan: <span className="font-medium capitalize">{currentPlan}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
          const isActive = currentPlan === key
          return (
            <Card key={key} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
              {isActive && (
                <Badge className="absolute -top-3 left-4">Current plan</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {key === 'pro' && <Zap className="h-4 w-4 text-primary" />}
                  {plan.label}
                </CardTitle>
                <CardDescription>
                  {key === 'starter' ? 'Free' : 'Billed monthly'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {key === 'pro' && !isActive && <UpgradeButton />}
                {isActive && key === 'starter' && (
                  <p className="text-xs text-muted-foreground">No payment required</p>
                )}
                {isActive && key === 'pro' && (
                  <p className="text-xs text-muted-foreground">
                    To cancel or manage your subscription, contact support.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
