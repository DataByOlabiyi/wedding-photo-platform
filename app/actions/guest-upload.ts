'use server'

import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPinCookie } from '@/lib/pin-cookie'
import { checkUploadRateLimit, getIp } from '@/lib/rate-limit'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { requestUploadUrlSchema, confirmUploadSchema, type ConfirmUploadInput } from '@/lib/validation-schemas'
import type { SignedUploadUrlResult } from '@/lib/types'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'image/gif', 'image/avif',
])

// Guest-facing: no user session. All preconditions are validated server-side
// before a signed URL is issued — PIN cookie, plan limits, file type/size.
export async function requestSignedUploadUrl(
  input: unknown
): Promise<SignedUploadUrlResult | { error: string }> {
  const headersList = await headers()
  const ip = getIp(headersList)

  const { allowed } = await checkUploadRateLimit(ip)
  if (!allowed) return { error: 'Upload limit reached. Please try again later.' }

  const parsed = requestUploadUrlSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }
  const { eventId, fileType, fileSize } = parsed.data

  if (!ALLOWED_MIME_TYPES.has(fileType)) {
    return { error: 'File type not allowed. Photos only (JPEG, PNG, HEIC, WebP).' }
  }
  if (fileSize > 100 * 1024 * 1024) {
    return { error: 'File exceeds 100 MB limit.' }
  }

  const db = createAdminClient()

  const { data: event } = await db
    .from('events')
    .select('id, status, closes_at, pin_hash, organizations(plan)')
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()

  if (!event) return { error: 'Event not found.' }
  if (event.status !== 'open') return { error: 'This event is no longer accepting uploads.' }
  if (event.closes_at && new Date(event.closes_at) < new Date()) {
    return { error: 'This event has closed.' }
  }

  if (event.pin_hash) {
    const cookieStore = await cookies()
    const pinVerified = await verifyPinCookie(cookieStore, eventId)
    if (!pinVerified) return { error: 'PIN verification required.' }
  }

  if (process.env.NEXT_PUBLIC_BETA_FREE_PRO !== 'true') {
    const org = Array.isArray(event.organizations) ? event.organizations[0] : event.organizations as { plan: string } | null
    const plan = (org?.plan ?? 'starter') as keyof typeof PLAN_LIMITS
    const limit = PLAN_LIMITS[plan]?.maxPhotosPerEvent ?? null

    if (limit !== null) {
      const { count } = await db
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('deleted_at', null)

      if ((count ?? 0) >= limit) {
        return { error: `This event has reached its ${limit}-photo limit.` }
      }
    }
  }

  const ts = Date.now()
  const uniqueId = crypto.randomUUID().slice(0, 7)
  const storagePath = `${eventId}/uploads/${ts}-${uniqueId}.jpg`
  const thumbnailPath = `${eventId}/thumbnails/${ts}-${uniqueId}-thumb.jpg`

  const [mainResult, thumbResult] = await Promise.all([
    db.storage.from('wedding-media').createSignedUploadUrl(storagePath),
    db.storage.from('wedding-media').createSignedUploadUrl(thumbnailPath),
  ])

  if (mainResult.error || !mainResult.data?.signedUrl) {
    console.error('Failed to create signed upload URL:', mainResult.error?.message)
    return { error: 'Could not prepare upload. Please try again.' }
  }
  if (thumbResult.error || !thumbResult.data?.signedUrl) {
    console.error('Failed to create thumbnail signed upload URL:', thumbResult.error?.message)
    return { error: 'Could not prepare upload. Please try again.' }
  }

  return {
    uploadUrl: mainResult.data.signedUrl,
    thumbnailUploadUrl: thumbResult.data.signedUrl,
    storagePath,
    thumbnailPath,
  }
}

export async function confirmUpload(
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  const parsed = confirmUploadSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }
  const {
    eventId, storagePath, thumbnailPath,
    uploadedBy, guestTag, guestToken,
    fileSize, fileHash, width, height,
  }: ConfirmUploadInput = parsed.data

  // Enforce that storagePath is scoped to this event — prevents cross-tenant gallery pollution
  // where a caller passes a storagePath from a different event/org.
  if (!storagePath.startsWith(`${eventId}/`) || storagePath.includes('..')) {
    return { success: false, error: 'Invalid upload path.' }
  }
  if (thumbnailPath && (!thumbnailPath.startsWith(`${eventId}/`) || thumbnailPath.includes('..'))) {
    return { success: false, error: 'Invalid thumbnail path.' }
  }

  const db = createAdminClient()

  // Verify the file actually landed in storage before creating the DB row
  const folder = storagePath.substring(0, storagePath.lastIndexOf('/'))
  const filename = storagePath.substring(storagePath.lastIndexOf('/') + 1)
  const { data: files, error: listErr } = await db.storage
    .from('wedding-media')
    .list(folder, { search: filename })

  if (listErr || !files?.some(f => f.name === filename)) {
    return { success: false, error: 'Upload not found. Please try uploading again.' }
  }

  // Re-check plan limit to guard against concurrent uploads racing past the limit
  if (process.env.NEXT_PUBLIC_BETA_FREE_PRO !== 'true') {
    const { data: event } = await db
      .from('events')
      .select('organizations(plan)')
      .eq('id', eventId)
      .single()

    const org = event
      ? (Array.isArray(event.organizations) ? event.organizations[0] : event.organizations) as { plan: string } | null
      : null
    const plan = (org?.plan ?? 'starter') as keyof typeof PLAN_LIMITS
    const limit = PLAN_LIMITS[plan]?.maxPhotosPerEvent ?? null

    if (limit !== null) {
      const { count } = await db
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('deleted_at', null)

      if ((count ?? 0) >= limit) {
        // Clean up the orphaned storage object
        await db.storage.from('wedding-media').remove([storagePath])
        return { success: false, error: `Photo limit reached. This event is full.` }
      }
    }
  }

  const { data: urlData } = db.storage.from('wedding-media').getPublicUrl(storagePath)
  const fileUrl = urlData.publicUrl
  const thumbnailUrl = thumbnailPath
    ? db.storage.from('wedding-media').getPublicUrl(thumbnailPath).data.publicUrl
    : null

  const { error: insertErr } = await db.from('media').insert({
    event_id: eventId,
    file_url: fileUrl,
    thumbnail_url: thumbnailUrl,
    media_type: 'image',
    uploaded_by: uploadedBy,
    guest_tag: guestTag ?? null,
    file_size: fileSize,
    file_hash: fileHash ?? null,
    width: width ?? null,
    height: height ?? null,
    guest_token: guestToken,
  })

  if (insertErr) {
    console.error('confirmUpload insert error:', insertErr.message)
    return { success: false, error: 'Failed to save upload record. Please try again.' }
  }

  return { success: true }
}
