'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// Guest-facing action: no user session exists. createAdminClient() is used because
// the media RLS only allows reads via get_my_org_id() (authenticated couples) or the
// public approved-media policy (guests can't read their own pending rows). Identity
// is confirmed by: UUID format guard → guest_token/uploaded_by DB match → sessionToken check.

export async function guestSelfDeleteMedia(
  mediaId: string,
  guestId: string,
  sessionToken?: string,
  eventId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(mediaId)) {
      return { success: false, error: 'Invalid request' }
    }

    const isToken = UUID_RE.test(guestId)
    const supabase = createAdminClient()

    let query = supabase
      .from('media')
      .select('id, guest_token, event_id, uploaded_at')
      .eq('id', mediaId)
      .is('deleted_at', null)

    query = isToken ? query.eq('guest_token', guestId) : query.eq('uploaded_by', guestId)

    const { data: media, error: fetchError } = await query.single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    const uploadTime = new Date(media.uploaded_at).getTime()
    if (Date.now() - uploadTime > 24 * 60 * 60 * 1000) {
      return { success: false, error: 'Delete window has expired (24 hours)' }
    }

    if (eventId && media.event_id !== eventId) {
      return { success: false, error: 'Media not found' }
    }

    // Rows without a guest_token are legacy rows with no stable device identity to verify
    // against — block the delete entirely rather than allowing any token to substitute.
    if (!media.guest_token) {
      return { success: false, error: 'You can only delete photos uploaded from your own device' }
    }
    if (!sessionToken || sessionToken !== media.guest_token) {
      return { success: false, error: 'You can only delete photos uploaded from your own device' }
    }

    const { error: deleteError } = await supabase
      .from('media')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaId)

    if (deleteError) return { success: false, error: deleteError.message }

    return { success: true }
  } catch (error) {
    console.error('Guest self-delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
