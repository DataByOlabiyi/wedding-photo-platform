import { requireOrg } from '@/lib/auth'
import { PAYSTACK_PLAN } from '@/lib/paystack'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { UpgradeButton } from './upgrade-button'
import { ManageSubscriptionButton } from './manage-subscription-button'

export default async function BillingPage() {
  const { membership } = await requireOrg()
  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations as { plan: string } | null

  const currentPlan = (org?.plan ?? 'starter') as 'starter' | 'pro'

  const db = createAdminClient()

  // Event count
  const { count: eventCount } = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', membership.organization_id)

  // For Starter: count photos across their single event
  let photoCount = 0
  if (currentPlan === 'starter') {
    const { data: starterEvent } = await db
      .from('events')
      .select('id')
      .eq('organization_id', membership.organization_id)
      .limit(1)
      .single()

    if (starterEvent) {
      const { count } = await db
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', starterEvent.id)
        .is('deleted_at', null)
      photoCount = count ?? 0
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1.5">
        <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Account</p>
        <h1 className="font-serif text-heading">Billing & plan</h1>
        <p className="text-body text-muted-foreground">
          Current plan: <span className="font-medium capitalize text-foreground">{currentPlan}</span>
        </p>
      </div>

      {process.env.NEXT_PUBLIC_BETA_FREE_PRO === "true" && (
        <Alert className="border-transparent bg-warning text-warning-foreground">
          <Zap className="h-4 w-4" />
          <AlertTitle>Beta — Pro is free</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            You&apos;re on the Pro plan for free during our beta. All features are enabled — no payment required.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Events row */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-caption text-muted-foreground">Events</span>
              <span className="font-mono text-data">
                {eventCount ?? 0}{currentPlan === 'starter' ? ' / 1' : ''}
              </span>
            </div>
            {currentPlan === 'starter' && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (eventCount ?? 0) >= 1 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, (eventCount ?? 0) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Photos row — only show for Starter (Pro is unlimited) */}
          {currentPlan === 'starter' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-caption text-muted-foreground">Photos (current event)</span>
                <span className={`font-mono text-data ${photoCount >= 200 ? 'text-destructive' : ''}`}>
                  {photoCount} / 200
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    photoCount >= 200 ? 'bg-destructive' : photoCount >= 160 ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, (photoCount / 200) * 100)}%` }}
                />
              </div>
              {photoCount >= 160 && photoCount < 200 && (
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge className="border-transparent bg-warning text-warning-foreground">Nearing limit</Badge>
                  Upgrade to Pro for unlimited photos.
                </p>
              )}
              {photoCount >= 200 && (
                <p className="text-xs text-destructive">Photo limit reached. Guests cannot upload more photos until you upgrade.</p>
              )}
            </div>
          )}

          {currentPlan === 'pro' && (
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-data">{eventCount ?? 0}</span> event{(eventCount ?? 0) !== 1 ? 's' : ''} · Unlimited photos
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={`relative ${currentPlan === 'starter' ? 'ring-2 ring-primary' : ''}`}>
          {currentPlan === 'starter' && (
            <Badge className="absolute -top-3 left-4">Current plan</Badge>
          )}
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>Free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {['1 event', '200 photos per event', 'Individual photo download'].map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {currentPlan === 'starter' && (
              <p className="text-xs text-muted-foreground">No payment required</p>
            )}
          </CardContent>
        </Card>

        <Card className={`relative ${currentPlan === 'pro' ? 'ring-2 ring-primary' : ''}`}>
          {currentPlan === 'pro' && (
            <Badge className="absolute -top-3 left-4">Current plan</Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {PAYSTACK_PLAN.label}
            </CardTitle>
            <CardDescription><span className="font-mono text-data text-foreground">&#x20A6;19,000</span> / month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PAYSTACK_PLAN.features.map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {currentPlan !== 'pro' && <UpgradeButton />}
            {currentPlan === 'pro' && process.env.NEXT_PUBLIC_BETA_FREE_PRO !== "true" && (
              <ManageSubscriptionButton />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
