'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrgOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STORAGE_BATCH_SIZE = 500

export async function deleteAccount() {
  const { user, membership } = await requireOrgOwner()
  const db = createAdminClient()
  const orgId = membership.organization_id

  // Step 1: Fetch event IDs for this org
  const { data: orgEvents, error: eventsError } = await db
    .from('events')
    .select('id')
    .eq('organization_id', orgId)

  if (eventsError) {
    console.error('[deleteAccount] Failed to fetch events:', eventsError)
    return { error: 'Could not retrieve account data. Please try again or contact support.' }
  }

  const eventIds = (orgEvents ?? []).map(e => e.id)

  // Step 2: Fetch media file paths and delete from storage
  if (eventIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await db
      .from('media')
      .select('file_url, thumbnail_url')
      .in('event_id', eventIds)

    if (mediaError) {
      console.error('[deleteAccount] Failed to fetch media:', mediaError)
      return { error: 'Could not retrieve photo data. Please try again or contact support.' }
    }

    if (mediaRows && mediaRows.length > 0) {
      const storagePaths = mediaRows.flatMap(row => {
        const paths: string[] = []
        const pattern = /\/storage\/v1\/object\/public\/wedding-media\/(.+)/
        if (row.file_url) {
          const m = row.file_url.match(pattern)
          if (m) paths.push(m[1])
        }
        if (row.thumbnail_url) {
          const m = row.thumbnail_url.match(pattern)
          if (m) paths.push(m[1])
        }
        return paths
      })

      if (storagePaths.length > 0) {
        // Chunk into batches — Supabase Storage's remove() has undocumented
        // limits on batch size that can cause silent truncation at large counts.
        for (let i = 0; i < storagePaths.length; i += STORAGE_BATCH_SIZE) {
          const chunk = storagePaths.slice(i, i + STORAGE_BATCH_SIZE)
          const { error: storageError } = await db.storage
            .from('wedding-media')
            .remove(chunk)
          if (storageError) {
            console.error('[deleteAccount] Storage removal partial failure:', storageError)
          }
        }
      }
    }
  }

  // Step 3: Delete events (cascades to media rows, featured_media, guests, audit_logs)
  const { error: eventsDeleteError } = await db
    .from('events')
    .delete()
    .eq('organization_id', orgId)

  if (eventsDeleteError) {
    console.error('[deleteAccount] Failed to delete events:', eventsDeleteError)
    return { error: 'Could not delete event data. Contact support with reference: DEL-EVT.' }
  }

  // Step 4: Delete the organization (cascades to org_members)
  const { error: orgDeleteError } = await db
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (orgDeleteError) {
    console.error('[deleteAccount] Failed to delete organization:', orgDeleteError)
    return { error: 'Could not delete organization data. Contact support with reference: DEL-ORG.' }
  }

  // Step 5: Delete the Supabase Auth user (must be last — user identity needed for auth checks above)
  const { error: authDeleteError } = await db.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    console.error('[deleteAccount] Failed to delete auth user:', authDeleteError)
    return { error: 'Account data was deleted but credentials could not be removed. Contact support with reference: DEL-AUTH.' }
  }

  // Sign out the current session and redirect to home
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/')
}
