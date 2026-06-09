'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // createAdminClient() verifies the admin token internally — throws if unauthorized
    const supabase = await createAdminClient()

    // Get the media item first to get file paths
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Log admin action (non-fatal — table may not exist during migration)
    await supabase.from('audit_logs').insert({
      action: 'admin_delete',
      media_id: mediaId,
      metadata: { uploaded_by: media.uploaded_by, file_url: media.file_url },
    }).then(() => {}, () => {})

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
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
