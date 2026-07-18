import { requireOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { PlusCircle, Calendar, ExternalLink, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const { membership } = await requireOrg()
  const db = createAdminClient()

  const { data: events } = await db
    .from('events')
    .select('id, name, slug, couple_names, wedding_date, status, created_at, gallery_token')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  // Photo counts per event — single aggregate RPC instead of fetching all rows
  const { data: mediaCounts } = events?.length
    ? await db.rpc('get_event_photo_counts', { org_id: membership.organization_id })
    : { data: [] }

  type PhotoCountRow = { event_id: string; photo_count: bigint | number }
  const countByEvent = ((mediaCounts ?? []) as PhotoCountRow[]).reduce((acc, row) => {
    acc[row.event_id] = Number(row.photo_count)
    return acc
  }, {} as Record<string, number>)

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Dashboard</p>
          <h1 className="font-serif text-heading">Your events</h1>
          <p className="text-body text-muted-foreground">
            Manage your wedding galleries and guest uploads.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New event
          </Button>
        </Link>
      </div>

      {(!events || events.length === 0) ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 text-center">
          <p className="font-serif text-subheading">No events yet</p>
          <p className="text-caption text-muted-foreground">Create your first event to get started.</p>
          <Link href="/dashboard/events/new" className="mt-2">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Card key={event.id} className="group relative overflow-hidden transition-[transform,border-color] duration-250 ease-snap hover:-translate-y-1 hover:border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{event.name}</CardTitle>
                  <Badge variant={event.status === 'open' ? 'default' : 'secondary'} className="shrink-0">
                    {event.status}
                  </Badge>
                </div>
                {event.couple_names && (
                  <CardDescription className="text-sm">{event.couple_names}</CardDescription>
                )}
                {event.wedding_date && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.wedding_date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-caption text-muted-foreground">Photos</span>
                  <span className="font-mono text-data">{countByEvent[event.id] ?? 0}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/events/${event.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                      Open gallery
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.id}/settings`}>
                    <Button variant="outline" size="icon-sm" aria-label="Event settings" title="Event settings">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <a href={`${baseUrl}/e/${event.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon-sm" aria-label="Open guest upload link" title="Open guest upload link">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
