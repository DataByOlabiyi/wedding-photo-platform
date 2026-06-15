'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function guestSelfDeleteMedia(
  mediaId: string,
  guestId: string,
  uploadedAt: string,
  sessionToken?: string,
  eventId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uploadTime = new Date(uploadedAt).getTime()
    if (Date.now() - uploadTime > 24 * 60 * 60 * 1000) {
      return { success: false, error: 'Delete window has expired (24 hours)' }
    }

    const supabase = createAdminClient()
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isToken = UUID_RE.test(guestId)

    let query = supabase
      .from('media')
      .select('id, guest_token, event_id')
      .eq('id', mediaId)
      .is('deleted_at', null)

    query = isToken ? query.eq('guest_token', guestId) : query.eq('uploaded_by', guestId)

    const { data: media, error: fetchError } = await query.single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Scope check: verify the media belongs to the event the guest is claiming
    // (prevents a leaked media ID from being used to delete photos in another event)
    if (eventId && media.event_id !== eventId) {
      return { success: false, error: 'Media not found' }
    }

    if (media.guest_token) {
      if (!sessionToken || sessionToken !== media.guest_token) {
        return { success: false, error: 'You can only delete photos uploaded from your own device' }
      }
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
