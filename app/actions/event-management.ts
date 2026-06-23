'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrg } from '@/lib/auth'
import { hashPin } from '@/lib/pin-utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// ─── Create event ────────────────────────────────────────────────────────────

const createEventSchema = z.object({
  eventName: z.string().min(2).max(120),
  coupleNames: z.string().min(2).max(120),
  weddingDate: z.string().optional(),
})

export async function createEvent(formData: FormData) {
  const { user, membership } = await requireOrg()
  const orgId = membership.organization_id
  const db = createAdminClient()

  // Pro plan guard: starter is capped at 1 event
  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations as { plan: string } | null

  if (process.env.NEXT_PUBLIC_BETA_FREE_PRO !== "true") {
    if (org?.plan === 'starter') {
      const { count } = await db
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      if ((count ?? 0) >= 1) {
        return { error: 'Starter plan is limited to 1 event. Upgrade to Pro for unlimited events.' }
      }
    }
  }

  const parsed = createEventSchema.safeParse({
    eventName: formData.get('eventName'),
    coupleNames: formData.get('coupleNames'),
    weddingDate: formData.get('weddingDate') || undefined,
  })

  if (!parsed.success) return { error: 'Invalid input.' }
  const { eventName, coupleNames, weddingDate } = parsed.data

  const baseSlug = toSlug(coupleNames + '-' + (weddingDate?.slice(0, 4) || new Date().getFullYear()))
  const galleryToken = crypto.randomUUID()

  // Retry with a suffix on unique-constraint violation (23505) so two orgs with
  // identical couple names don't permanently block each other.
  let event: { id: string } | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const eventSlug = attempt === 0
      ? baseSlug
      : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await db
      .from('events')
      .insert({
        organization_id: orgId,
        name: eventName,
        slug: eventSlug,
        couple_names: coupleNames,
        wedding_date: weddingDate || null,
        gallery_token: galleryToken,
        status: 'open',
      })
      .select('id')
      .single()

    if (data) { event = data; break }
    if (error?.code !== '23505') return { error: 'Could not create event.' }
  }

  if (!event) return { error: 'Could not create event (slug conflict after retries).' }

  revalidatePath('/dashboard')
  redirect(`/dashboard/events/${event.id}`)
}

// ─── Update event settings ───────────────────────────────────────────────────

export async function updateEventSettings(
  eventId: string,
  settings: {
    status?: 'open' | 'closed'
    pin?: string | null
    clearPin?: boolean
    guestsCanViewGallery?: boolean
    closesAt?: string | null
  }
) {
  const { membership } = await requireOrg()
  const db = createAdminClient()

  // Verify the event belongs to this org
  const { data: event } = await db
    .from('events')
    .select('id, organization_id')
    .eq('id', eventId)
    .eq('organization_id', membership.organization_id)
    .single()

  if (!event) return { error: 'Event not found.' }

  const updates: Record<string, unknown> = {}
  if (settings.status !== undefined) updates.status = settings.status
  if (settings.guestsCanViewGallery !== undefined) updates.guests_can_view_gallery = settings.guestsCanViewGallery
  if (settings.closesAt !== undefined) updates.closes_at = settings.closesAt
  if (settings.clearPin) updates.pin_hash = null
  if (settings.pin) updates.pin_hash = await hashPin(settings.pin)

  const { error } = await db.from('events').update(updates).eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${eventId}/settings`)
  return { success: true }
}

// ─── Delete event ─────────────────────────────────────────────────────────────

export async function deleteEvent(eventId: string) {
  const { membership } = await requireOrg()
  const db = createAdminClient()

  const { error } = await db
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('organization_id', membership.organization_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
