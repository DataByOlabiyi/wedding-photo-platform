'use server'

import { z } from 'zod'
import { requireSuperAdmin, assertSuperAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { platformAdminEmailSchema } from '@/lib/validation-schemas'
import { revalidatePath } from 'next/cache'

export async function overrideOrgPlan(orgId: string, plan: 'starter' | 'pro') {
  const actor = await requireSuperAdmin()
  const db = createAdminClient()

  const { data: org } = await db
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .maybeSingle()

  const { error } = await db.from('organizations').update({ plan }).eq('id', orgId)
  if (error) return { error: error.message }

  await db.from('audit_logs').insert({
    action: 'override_org_plan',
    media_id: null,
    metadata: {
      actor_user_id: actor.id,
      organization_id: orgId,
      old_plan: org?.plan ?? null,
      new_plan: plan,
    },
  }).then(({ error: auditError }) => {
    if (auditError) console.error('audit_log insert failed', auditError)
  }, (err) => console.error('audit_log insert failed', err))

  revalidatePath('/superadmin')
}

export async function grantPlatformAdmin(email: string): Promise<{ error?: string }> {
  const actor = await assertSuperAdmin()
  if (!actor) return { error: 'Unauthorized' }

  const parsed = platformAdminEmailSchema.safeParse({ email })
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const targetEmail = parsed.data.email.toLowerCase()

  const db = createAdminClient()

  // auth.admin has no lookup-by-email — paginated scan is the supported path
  // and platform staff counts keep this cheap.
  let targetId: string | null = null
  let page = 1
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return { error: 'Failed to look up account' }
    const match = data.users.find(u => u.email?.toLowerCase() === targetEmail)
    if (match) {
      targetId = match.id
      break
    }
    if (data.users.length < 1000) break
    page++
  }
  if (!targetId) return { error: 'No account with that email' }

  const { error: insertError } = await db.from('platform_admins').insert({
    user_id: targetId,
    role: 'admin',
    granted_by: actor.id,
  })
  if (insertError) {
    if (insertError.code === '23505') return { error: 'Already a platform admin' }
    return { error: insertError.message }
  }

  await db.from('audit_logs').insert({
    action: 'grant_platform_admin',
    media_id: null,
    metadata: {
      actor_user_id: actor.id,
      target_user_id: targetId,
      target_email: targetEmail,
    },
  }).then(({ error: auditError }) => {
    if (auditError) console.error('audit_log insert failed', auditError)
  }, (err) => console.error('audit_log insert failed', err))

  revalidatePath('/superadmin')
  return {}
}

export async function revokePlatformAdmin(userId: string): Promise<{ error?: string }> {
  const actor = await assertSuperAdmin()
  if (!actor) return { error: 'Unauthorized' }

  if (!z.string().uuid().safeParse(userId).success) return { error: 'Invalid user id' }

  const db = createAdminClient()

  // role filter makes superadmin rows structurally undeletable from this action
  const { data: deleted, error } = await db
    .from('platform_admins')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin')
    .select('user_id')
  if (error) return { error: error.message }
  if (!deleted || deleted.length === 0) return { error: 'Not found or not revocable' }

  await db.from('audit_logs').insert({
    action: 'revoke_platform_admin',
    media_id: null,
    metadata: {
      actor_user_id: actor.id,
      target_user_id: userId,
    },
  }).then(({ error: auditError }) => {
    if (auditError) console.error('audit_log insert failed', auditError)
  }, (err) => console.error('audit_log insert failed', err))

  revalidatePath('/superadmin')
  return {}
}
