import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkUploadRateLimit, getIp } from '@/lib/rate-limit'
import { PLAN_LIMITS } from '@/lib/plan-limits'

// Guest-facing public endpoint: no user session exists. Admin client is required because
// the events RLS policy scopes reads to org members via get_my_org_id() — anonymous reads
// are blocked by RLS. This is the same pattern used in app/e/[slug]/page.tsx. The endpoint
// is read-only, IP rate-limited, and returns no cross-tenant data (scoped to the supplied eventId).
const eventIdSchema = z.string().uuid()

export async function GET(request: NextRequest) {
  const ip = getIp(request.headers)

  const { allowed } = await checkUploadRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const rawEventId = request.nextUrl.searchParams.get('eventId')
  const parsed = eventIdSchema.safeParse(rawEventId)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  }
  const eventId = parsed.data

  const db = createAdminClient()

  // Fetch event + org plan in one query
  const { data: event, error } = await db
    .from('events')
    .select('id, organization_id, organizations(plan)')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const org = Array.isArray(event.organizations)
    ? event.organizations[0]
    : event.organizations as { plan: string } | null

  if (process.env.NEXT_PUBLIC_BETA_FREE_PRO === "true") {
    return NextResponse.json({ allowed: true, current: 0, limit: null, remaining: null })
  }

  const plan = (org?.plan ?? 'starter') as keyof typeof PLAN_LIMITS
  const limit = PLAN_LIMITS[plan]?.maxPhotosPerEvent ?? null

  // Pro plan: no limit
  if (limit === null) {
    return NextResponse.json({ allowed: true, current: 0, limit: null, remaining: null })
  }

  // Starter: count active photos for this event
  const { count, error: countError } = await db
    .from('media')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .is('deleted_at', null)

  if (countError) {
    console.error('check-event-limit count error:', countError)
    // Fail open on count errors — don't block uploads due to a count query failure
    return NextResponse.json({ allowed: true, current: 0, limit, remaining: limit })
  }

  const current = count ?? 0
  const remaining = Math.max(0, limit - current)

  return NextResponse.json({
    allowed: current < limit,
    current,
    limit,
    remaining,
  })
}
