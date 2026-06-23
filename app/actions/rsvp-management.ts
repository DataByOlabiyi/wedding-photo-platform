'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrg } from '@/lib/auth'
import type { RSVPStatus, Guest } from '@/lib/types'

export type { RSVPStatus, Guest }

export async function getGuestsWithStatus(
  eventId: string
): Promise<{ guests: Guest[]; error?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  try {
    const supabase = await createClient()

    const { data: eventCheck, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()

    if (eventError || !eventCheck) {
      return { guests: [], error: 'Event not found' }
    }

    const { data: guests, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('name')

    if (guestError) {
      return { guests: [], error: guestError.message }
    }

    if (!guests) {
      return { guests: [] }
    }

    const { data: media } = await supabase
      .from('media')
      .select('uploaded_by, uploaded_at')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false })

    const uploaders = new Map<string, string>()
    media?.forEach((item) => {
      if (!uploaders.has(item.uploaded_by)) {
        uploaders.set(item.uploaded_by, item.uploaded_at)
      }
    })

    // uploaded_by stores the guest's display name (set by the upload form), not a UUID,
    // so matching against guest.name is the correct join key.
    const guestsWithStatus: Guest[] = guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      rsvp_status: guest.rsvp_status as RSVPStatus,
      uploaded: uploaders.has(guest.name),
      uploaded_at: uploaders.get(guest.name),
    }))

    return { guests: guestsWithStatus }
  } catch (error) {
    console.error('Error fetching guests:', error)
    return { guests: [], error: 'Failed to fetch guests' }
  }
}

export async function updateGuestRsvp(
  eventId: string,
  guestId: string,
  status: RSVPStatus
): Promise<{ success: boolean; error?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  try {
    const supabase = await createClient()

    const { data: eventCheck, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()

    if (eventError || !eventCheck) {
      return { success: false, error: 'Event not found' }
    }

    const db = createAdminClient()
    const { error } = await db
      .from('guests')
      .update({ rsvp_status: status })
      .eq('id', guestId)
      .eq('event_id', eventId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return { success: false, error: 'Failed to update RSVP' }
  }
}

export async function addGuest(
  eventId: string,
  name: string,
  email?: string
): Promise<{ success: boolean; error?: string; guestId?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  try {
    const supabase = await createClient()

    const { data: eventCheck, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()

    if (eventError || !eventCheck) {
      return { success: false, error: 'Event not found' }
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('guests')
      .insert({ name, email, rsvp_status: 'pending', event_id: eventId })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, guestId: data?.id }
  } catch (error) {
    console.error('Error adding guest:', error)
    return { success: false, error: 'Failed to add guest' }
  }
}

export async function deleteGuest(
  eventId: string,
  guestId: string
): Promise<{ success: boolean; error?: string }> {
  const { membership } = await requireOrg()
  const orgId = membership.organization_id

  try {
    const supabase = await createClient()

    const { data: eventCheck, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()

    if (eventError || !eventCheck) {
      return { success: false, error: 'Event not found' }
    }

    const db = createAdminClient()
    const { error } = await db
      .from('guests')
      .delete()
      .eq('id', guestId)
      .eq('event_id', eventId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting guest:', error)
    return { success: false, error: 'Failed to delete guest' }
  }
}
