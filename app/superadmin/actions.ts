'use server'

import { requireSuperAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function overrideOrgPlan(orgId: string, plan: 'starter' | 'pro') {
  await requireSuperAdmin()
  const db = createAdminClient()
  const { error } = await db.from('organizations').update({ plan }).eq('id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/superadmin')
}
