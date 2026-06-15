import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Redirect to login if not authenticated. Returns the authenticated user.
export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')
  return user
}

// Redirect away if caller is not a platform superadmin.
export async function requireSuperAdmin() {
  const user = await requireAuth()
  if (user.app_metadata?.is_superadmin !== true) redirect('/dashboard')
  return user
}

// Return the org + membership for the authenticated user, or null if they have none.
export async function getOrgForUser(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_members')
    .select('organization_id, role, organizations(id, name, slug, plan, created_at)')
    .eq('user_id', userId)
    .maybeSingle()
  return data ?? null
}

// Like getOrgForUser but also requires authentication and redirects to onboarding
// if the user has no org yet (e.g. confirmed email but hasn't completed onboarding).
export async function requireOrg() {
  const user = await requireAuth()
  const membership = await getOrgForUser(user.id)
  if (!membership) redirect('/onboarding')
  return { user, membership }
}
