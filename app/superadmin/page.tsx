import { requireSuperAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, Users, Image as ImageIcon, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlanOverrideForm } from './plan-override-form'

export default async function SuperAdminPage() {
  await requireSuperAdmin()

  const db = createAdminClient()

  const [{ data: orgs }, { data: events }, { data: mediaCount }] = await Promise.all([
    db.from('organizations').select('id, name, slug, plan, created_at').order('created_at', { ascending: false }),
    db.from('events').select('id, organization_id, name, status').order('created_at', { ascending: false }),
    db.from('media').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const eventsByOrg = (events ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.organization_id] = (acc[e.organization_id] ?? 0) + 1
    return acc
  }, {})

  const proCount = (orgs ?? []).filter(o => o.plan === 'pro').length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Shield className="h-5 w-5 text-destructive" />
          <h1 className="font-serif text-lg font-semibold">Platform Admin</h1>
          <Badge variant="destructive" className="text-xs">Superadmin</Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Platform stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Organizations', value: (orgs ?? []).length, icon: Users },
            { label: 'Pro orgs', value: proCount, icon: Zap },
            { label: 'Events', value: (events ?? []).length, icon: ImageIcon },
            { label: 'Total photos', value: mediaCount ?? 0, icon: ImageIcon },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Organization list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(orgs ?? []).map(org => (
                <div key={org.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.slug} · {eventsByOrg[org.id] ?? 0} events ·{' '}
                      {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={org.plan === 'pro' ? 'default' : 'secondary'} className="capitalize">
                      {org.plan}
                    </Badge>
                    <PlanOverrideForm orgId={org.id} currentPlan={org.plan as 'starter' | 'pro'} />
                  </div>
                </div>
              ))}

              {(!orgs || orgs.length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No organizations yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
