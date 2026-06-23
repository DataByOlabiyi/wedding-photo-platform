import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  if (process.env.NEXT_PUBLIC_BETA_FREE_PRO === "true") {
    return Response.json({ error: "Payments are not active during beta" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const db = createAdminClient()
  const { data: membership, error: memberError } = await db
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single()

  if (memberError || !membership) return Response.json({ error: "No organization found" }, { status: 403 })
  if (membership.role !== "owner") return Response.json({ error: "Only org owners can manage billing" }, { status: 403 })

  const { data: org } = await db
    .from("organizations")
    .select("paystack_customer_code")
    .eq("id", membership.organization_id)
    .single()

  if (!org?.paystack_customer_code) {
    return Response.json({ error: "No Paystack subscription found" }, { status: 404 })
  }

  return Response.json({ url: `https://paystack.com/manage/subscriptions/${org.paystack_customer_code}` })
}
