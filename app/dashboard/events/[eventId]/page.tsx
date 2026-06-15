import { requireOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { EventGalleryClient } from './event-gallery-client'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function EventGalleryPage({ params }: Props) {
  const { eventId } = await params
  const { membership } = await requireOrg()
  const db = createAdminClient()

  // Verify event belongs to this org
  const { data: event } = await db
    .from('events')
    .select('id, name, slug, couple_names, status, gallery_token, plan:organizations(plan)')
    .eq('id', eventId)
    .eq('organization_id', membership.organization_id)
    .single()

  if (!event) notFound()

  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations as { plan: string } | null

  return (
    <EventGalleryClient
      eventId={eventId}
      eventName={event.name}
      eventSlug={event.slug}
      galleryToken={event.gallery_token}
      status={event.status}
      plan={org?.plan ?? 'starter'}
    />
  )
}
