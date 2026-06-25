'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrg } from '@/lib/auth'

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { membership } = await requireOrg()
    const supabase = createAdminClient()

    // Fetch without dotted-column filter — PostgREST dotted-column filters on nested
    // joins are not a reliable security boundary (join shape is unpredictable).
    // JS-side assertion below is the authoritative ownership check.
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('id, uploaded_by, file_url, event_id, events!inner(organization_id)')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // JS-side org assertion — authoritative ownership check
    type MediaWithEvent = { id: string; uploaded_by: string; file_url: string; event_id: string; events: Array<{ organization_id: string }> | { organization_id: string } | null }
    const mediaRow = media as unknown as MediaWithEvent
    const eventsField = mediaRow.events
    const mediaOrg = eventsField
      ? (Array.isArray(eventsField) ? eventsField[0]?.organization_id : eventsField.organization_id)
      : null
    if (!mediaOrg || mediaOrg !== membership.organization_id) {
      return { success: false, error: 'Media not found' }
    }

    await supabase.from('audit_logs').insert({
      action: 'couple_delete',
      media_id: mediaId,
      metadata: { uploaded_by: media.uploaded_by, file_url: media.file_url },
    }).then(() => {}, (err) => console.error('audit_log insert failed', err))

    const { error: deleteError } = await supabase
      .from('media')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaId)

    if (deleteError) return { success: false, error: deleteError.message }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
