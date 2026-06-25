'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrg } from '@/lib/auth'

export async function addToFeatured(mediaId: string): Promise<{ success: boolean; error?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  const supabase = await createClient()

  // Verify the media belongs to this org before inserting — IDOR guard.
  // JS-side org assertion is added after the fetch because PostgREST dotted-column
  // filters (.eq('events.organization_id', orgId)) are not a reliable security boundary.
  const { data: owned } = await supabase
    .from('media')
    .select('id, events!inner(organization_id)')
    .eq('id', mediaId)
    .single()

  type OwnedMediaRow = { id: string; events: Array<{ organization_id: string }> | { organization_id: string } | null }
  const row = owned as unknown as OwnedMediaRow | null
  const eventsField = row?.events
  const eventOrg = eventsField
    ? (Array.isArray(eventsField) ? eventsField[0]?.organization_id : eventsField.organization_id)
    : null

  if (!owned || eventOrg !== orgId) return { success: false, error: 'Media not found' }

  const { error } = await supabase
    .from('featured_media')
    .insert([{ media_id: mediaId }])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeFromFeatured(featuredId: string): Promise<{ success: boolean; error?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  const supabase = await createClient()

  // Verify the featured_media row belongs to this org before deleting — IDOR guard.
  // JS-side assertion used because PostgREST dotted-column filters are not a reliable
  // security boundary for nested joins.
  const { data: owned } = await supabase
    .from('featured_media')
    .select('id, media!inner(event_id, events!inner(organization_id))')
    .eq('id', featuredId)
    .single()

  type OwnedMedia = { event_id: string; events: { organization_id: string } | Array<{ organization_id: string }> }
  type OwnedRow = { id: string; media: OwnedMedia | OwnedMedia[] }
  const row = owned as OwnedRow | null
  const media = row ? (Array.isArray(row.media) ? row.media[0] : row.media) : null
  const eventOrg = media
    ? (Array.isArray(media.events) ? media.events[0]?.organization_id : media.events?.organization_id)
    : null

  if (!owned || eventOrg !== orgId) return { success: false, error: 'Media not found' }

  const { error } = await supabase
    .from('featured_media')
    .delete()
    .eq('id', featuredId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
