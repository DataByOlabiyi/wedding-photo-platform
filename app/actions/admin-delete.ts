'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/verify-admin'

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  // Verify admin token
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = await createClient()

    // Get the media item first to get file paths
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Delete from storage using service role (has full permissions)
    const fileUrl = new URL(media.file_url)
    const filePath = fileUrl.pathname.split('/').slice(-2).join('/')

    await supabase.storage.from('wedding-media').remove([filePath])

    // Delete thumbnail if exists
    if (media.thumbnail_url) {
      const thumbUrl = new URL(media.thumbnail_url)
      const thumbPath = thumbUrl.pathname.split('/').slice(-2).join('/')
      await supabase.storage.from('wedding-media').remove([thumbPath])
    }

    // Delete from database (using service role, bypasses RLS)
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
