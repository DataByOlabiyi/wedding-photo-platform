import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { PlatformAdminRole } from '@/lib/types'

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

// Admin client is safe here: only ever called after the session is verified,
// and platform_admins is service-role-only by design (deny-all RLS).
export async function getPlatformAdminRole(userId: string): Promise<PlatformAdminRole | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('platform_admins')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  // DB errors fail closed (treated as not-staff) but must be visible in logs,
  // otherwise an unapplied migration reads as a silent lockout.
  if (error) console.error('platform_admins lookup failed', error)
  if (!data) return null
  return data.role as PlatformAdminRole
}

// Redirect away unless caller holds any platform staff role (admin or superadmin).
export async function requirePlatformAdmin(): Promise<{ user: User; role: PlatformAdminRole }> {
  const user = await requireAuth()
  const role = await getPlatformAdminRole(user.id)
  if (!role) redirect('/dashboard')
  return { user, role }
}

// Redirect away if caller is not a platform superadmin.
export async function requireSuperAdmin() {
  const user = await requireAuth()
  const role = await getPlatformAdminRole(user.id)
  if (role !== 'superadmin') redirect('/dashboard')
  return user
}

// Non-redirecting variant for server actions that return errors instead of navigating.
export async function assertSuperAdmin(): Promise<User | null> {
  const user = await getSessionUser()
  if (!user) return null
  const role = await getPlatformAdminRole(user.id)
  return role === 'superadmin' ? user : null
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

// Like requireOrg but also enforces that the caller holds the 'owner' role.
// Redirects to /dashboard with an error param for editor-role members attempting
// owner-only operations (account deletion, org-level destructive actions).
export async function requireOrgOwner() {
  const { user, membership } = await requireOrg()
  if (membership.role !== 'owner') redirect('/dashboard?error=forbidden')
  return { user, membership }
}
