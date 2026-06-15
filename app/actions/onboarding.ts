'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const onboardingSchema = z.object({
  orgName: z.string().min(2).max(80),
  coupleNames: z.string().min(2).max(120),
  eventName: z.string().min(2).max(120),
  weddingDate: z.string().optional(),
})

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function createOrgAndFirstEvent(formData: FormData) {
  const user = await requireAuth()

  const parsed = onboardingSchema.safeParse({
    orgName: formData.get('orgName'),
    coupleNames: formData.get('coupleNames'),
    eventName: formData.get('eventName'),
    weddingDate: formData.get('weddingDate') || undefined,
  })

  if (!parsed.success) {
    return { error: 'Invalid input. Please check your details.' }
  }

  const { orgName, coupleNames, eventName, weddingDate } = parsed.data
  const db = createAdminClient()

  // Check the user doesn't already have an org (idempotent guard)
  const { data: existing } = await db
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/dashboard')

  // Create organization
  const orgSlug = toSlug(orgName) + '-' + Math.random().toString(36).slice(2, 6)
  const { data: org, error: orgErr } = await db
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug, plan: 'starter' })
    .select('id')
    .single()

  if (orgErr || !org) return { error: 'Could not create your account. Please try again.' }

  // Link user as owner
  const { error: memberErr } = await db
    .from('org_members')
    .insert({ organization_id: org.id, user_id: user.id, role: 'owner' })

  if (memberErr) return { error: 'Account setup failed. Please contact support.' }

  // Create first event
  const eventSlug = toSlug(coupleNames + '-' + (weddingDate?.slice(0, 4) || new Date().getFullYear()))
  const galleryToken = crypto.randomUUID()

  const { error: eventErr } = await db
    .from('events')
    .insert({
      organization_id: org.id,
      name: eventName,
      slug: eventSlug,
      couple_names: coupleNames,
      wedding_date: weddingDate || null,
      gallery_token: galleryToken,
      status: 'open',
    })

  if (eventErr) return { error: 'Event creation failed. You can create one from your dashboard.' }

  redirect('/dashboard')
}
