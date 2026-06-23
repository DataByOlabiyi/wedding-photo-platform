import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EventSettingsForm } from './event-settings-form'

export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const { membership } = await requireOrg()
  const db = createAdminClient()

  const { data: event } = await db
    .from('events')
    .select('status, guests_can_view_gallery, closes_at, pin_hash, gallery_token, slug')
    .eq('id', eventId)
    .eq('organization_id', membership.organization_id)
    .single()

  if (!event) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  return (
    <EventSettingsForm
      eventId={eventId}
      baseUrl={baseUrl}
      initialData={{
        status: event.status as 'open' | 'closed',
        guestsCanViewGallery: event.guests_can_view_gallery,
        closesAt: event.closes_at ? event.closes_at.slice(0, 10) : '',
        hasPin: !!event.pin_hash,
        slug: event.slug,
      }}
    />
  )
}
