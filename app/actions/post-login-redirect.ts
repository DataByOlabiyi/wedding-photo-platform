'use server'

import { getSessionUser, getPlatformAdminRole } from '@/lib/auth'

export async function resolvePostLoginRedirect(): Promise<string> {
  try {
    // '/dashboard' rather than '/auth/login': a cookie-propagation race right
    // after sign-in must not bounce the user back to the login form; the proxy
    // re-redirects genuinely unauthenticated visitors anyway.
    const user = await getSessionUser()
    if (!user) return '/dashboard'
    const role = await getPlatformAdminRole(user.id)
    return role ? '/superadmin' : '/dashboard'
  } catch {
    return '/dashboard'
  }
}
