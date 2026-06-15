'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrg } from '@/lib/auth'

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { membership } = await requireOrg()
    const supabase = createAdminClient()

    // Verify the media belongs to one of this org's events before touching it
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('id, uploaded_by, file_url, event_id, events!inner(organization_id)')
      .eq('id', mediaId)
      .eq('events.organization_id', membership.organization_id)
      .single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    await supabase.from('audit_logs').insert({
      action: 'couple_delete',
      media_id: mediaId,
      metadata: { uploaded_by: media.uploaded_by, file_url: media.file_url },
    }).then(() => {}, () => {})

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
