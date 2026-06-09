'use server'

import { createClient } from '@/lib/supabase/server'

export async function guestSelfDeleteMedia(
  mediaId: string,
  guestId: string,
  uploadedAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uploadTime = new Date(uploadedAt).getTime()
    const diffMs = Date.now() - uploadTime
    const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

    if (diffMs > DELETE_WINDOW_MS) {
      return { success: false, error: 'Delete window has expired (24 hours)' }
    }

    const supabase = await createClient()

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isToken = UUID_RE.test(guestId)

    // Verify the media belongs to this guest — match by token (new) or name (legacy)
    const query = supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)

    const { data: media, error: fetchError } = await (
      isToken
        ? query.eq('guest_token', guestId)
        : query.eq('uploaded_by', guestId)
    ).single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Delete from storage
    const fileUrl = new URL(media.file_url)
    const filePath = fileUrl.pathname.split('/').slice(-2).join('/')
    await supabase.storage.from('wedding-media').remove([filePath])

    // Delete thumbnail if exists
    if (media.thumbnail_url) {
      const thumbUrl = new URL(media.thumbnail_url)
      const thumbPath = thumbUrl.pathname.split('/').slice(-2).join('/')
      await supabase.storage.from('wedding-media').remove([thumbPath])
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Guest self-delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
