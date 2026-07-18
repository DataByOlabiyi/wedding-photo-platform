import { requireSuperAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, Users, Image as ImageIcon, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlanOverrideForm } from './plan-override-form'
import { EventSearchInput } from './event-search-input'

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireSuperAdmin()

  const { q: rawQ } = await searchParams
  const q = rawQ ? rawQ.replace(/[%_]/g, '\\$&').trim() : ''

  const db = createAdminClient()

  const [{ data: orgs }, { data: events }, { data: mediaCount }] = await Promise.all([
    db.from('organizations').select('id, name, slug, plan, created_at').order('created_at', { ascending: false }),
    db.from('events').select('id, organization_id, name, status').order('created_at', { ascending: false }),
    db.from('media').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const matchedEvents = q
    ? await db
        .from('events')
        .select('id, name, slug, couple_names, status, organization_id, organizations(name, plan)')
        .or(`slug.ilike.%${q}%,couple_names.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(20)
    : null

  const eventsByOrg = (events ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.organization_id] = (acc[e.organization_id] ?? 0) + 1
    return acc
  }, {})

  const proCount = (orgs ?? []).filter(o => o.plan === 'pro').length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Shield className="h-4 w-4 text-destructive" />
          <h1 className="text-sm font-semibold tracking-[0.01em]">Platform Admin</h1>
          <Badge variant="destructive">Superadmin</Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
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
                  <span className="text-caption text-muted-foreground">{label}</span>
                </div>
                <p className="font-mono text-2xl font-medium">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                    <p className="font-mono text-xs text-muted-foreground">
                      {org.slug} · {eventsByOrg[org.id] ?? 0} events ·{' '}
                      {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={org.plan === 'pro' ? 'default' : 'secondary'}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EventSearchInput defaultValue={rawQ ?? ''} />

            {!q && (
              <p className="text-sm text-muted-foreground">
                Search by event slug or couple name to look up a specific event.
              </p>
            )}

            {q && matchedEvents && (
              <>
                {matchedEvents.data && matchedEvents.data.length > 0 ? (
                  <div className="divide-y divide-border rounded-lg border">
                    {matchedEvents.data.map(event => {
                      const orgData = Array.isArray(event.organizations)
                        ? event.organizations[0]
                        : event.organizations as { name: string; plan: string } | null
                      return (
                        <div key={event.id} className="flex items-start justify-between gap-4 px-4 py-3">
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-medium truncate">{event.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono">{event.slug}</code>
                              {event.couple_names && (
                                <span> · {event.couple_names}</span>
                              )}
                            </p>
                            {orgData && (
                              <p className="text-xs text-muted-foreground">
                                {orgData.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {orgData && (
                              <Badge variant={orgData.plan === 'pro' ? 'default' : 'secondary'}>
                                {orgData.plan}
                              </Badge>
                            )}
                            <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                            <a
                              href={`/dashboard/events/${event.id}`}
                              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No events found matching &ldquo;{rawQ}&rdquo;.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
