import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPaystackSecretKey } from "@/lib/paystack"
import * as Sentry from "@sentry/nextjs"

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

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"
  const planCode = process.env.PAYSTACK_PRO_PLAN_CODE

  const body: Record<string, unknown> = {
    email: user.email,
    amount: 1_900_000,
    currency: "NGN",
    metadata: { organization_id: membership.organization_id },
    callback_url: `${baseUrl}/dashboard?upgraded=true`,
  }
  if (planCode) body.plan = planCode

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const json = await res.json() as { status: boolean; data?: { authorization_url: string } }
    if (!json.status || !json.data) {
      return Response.json({ error: "Paystack initialization failed" }, { status: 502 })
    }
    return Response.json({ url: json.data.authorization_url })
  } catch (err) {
    Sentry.captureException(err)
    return Response.json({ error: "Payment service unavailable" }, { status: 500 })
  }
}
