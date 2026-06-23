import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Service-role client — bypasses RLS.
// Only call from server actions / route handlers that have already verified
// the caller's identity via Supabase Auth (requireAuth / requireSuperAdmin).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

