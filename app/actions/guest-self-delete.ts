'use server'

import { createClient } from '@/lib/supabase/server'

export async function guestSelfDeleteMedia(
  mediaId: string,
  guestId: string,
  uploadedAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the media was uploaded less than 30 minutes ago
    const uploadTime = new Date(uploadedAt).getTime()
    const now = Date.now()
    const diffMinutes = (now - uploadTime) / (1000 * 60)

    if (diffMinutes > 30) {
      return { success: false, error: 'Delete window has expired (30 minutes)' }
    }

    const supabase = await createClient()

    // Get the media to verify it belongs to the guest
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .eq('uploaded_by', guestId)
      .single()

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
