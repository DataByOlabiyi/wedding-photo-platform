'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrg } from '@/lib/auth'

export async function addToFeatured(mediaId: string): Promise<{ success: boolean; error?: string }> {
  await requireOrg()

  const supabase = await createClient()
  const { error } = await supabase
    .from('featured_media')
    .insert([{ media_id: mediaId }])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeFromFeatured(featuredId: string): Promise<{ success: boolean; error?: string }> {
  await requireOrg()

  const supabase = await createClient()
  const { error } = await supabase
    .from('featured_media')
    .delete()
    .eq('id', featuredId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
