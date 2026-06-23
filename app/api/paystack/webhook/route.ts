import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyWebhookSignature } from "@/lib/paystack"
import * as Sentry from "@sentry/nextjs"

const webhookEnvelopeSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
})

type ChargeSuccess = {
  event: "charge.success"
  data: { metadata: { organization_id?: string }; customer: { customer_code: string } }
}
type SubscriptionCreate = {
  event: "subscription.create"
  data: { metadata: { organization_id?: string } }
}
type SubscriptionDisable = {
  event: "subscription.disable"
  data: { metadata: { organization_id?: string }; customer: { customer_code: string } }
}
type InvoicePaymentFailed = {
  event: "invoice.payment_failed"
  data: { subscription?: { metadata?: { organization_id?: string } }; customer?: { customer_code?: string } }
}
type PaystackEvent = ChargeSuccess | SubscriptionCreate | SubscriptionDisable | InvoicePaymentFailed | { event: string; data: unknown }

async function updateOrgPlan(orgId: string, plan: "starter" | "pro"): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.from("organizations").update({ plan }).eq("id", orgId)
  if (error) throw new Error(`Failed to update org plan: ${error.message}`)
}

async function orgIdFromCustomerCode(customerCode: string): Promise<string | undefined> {
  const db = createAdminClient()
  const { data } = await db
    .from("organizations")
    .select("id")
    .eq("paystack_customer_code", customerCode)
    .single()
  return data?.id
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature") ?? ""

  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 })

  try {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 400 })
    }
  } catch (err) {
    Sentry.captureException(err)
    return Response.json({ error: "Signature verification failed" }, { status: 500 })
  }

  const envelopeParse = webhookEnvelopeSchema.safeParse(JSON.parse(rawBody))
  if (!envelopeParse.success) {
    return Response.json({ error: "Invalid payload shape" }, { status: 400 })
  }
  const payload = envelopeParse.data as PaystackEvent
  const db = createAdminClient()

  try {
    if (payload.event === "charge.success") {
      const e = payload as ChargeSuccess
      const orgId = e.data.metadata.organization_id
      const customerCode = e.data.customer.customer_code
      if (!orgId) return Response.json({ ok: true })

      // Cross-validate: if the org already has a different customer code the metadata may be tampered
      const { data: existing } = await db
        .from("organizations")
        .select("paystack_customer_code, plan")
        .eq("id", orgId)
        .single()

      if (existing?.paystack_customer_code && existing.paystack_customer_code !== customerCode) {
        Sentry.captureMessage(`Paystack webhook: customer_code mismatch for org ${orgId}`, { level: "warning" })
        return Response.json({ ok: true })
      }

      // Idempotency: already upgraded with the same customer code — skip
      if (existing?.plan === "pro" && existing.paystack_customer_code === customerCode) {
        return Response.json({ ok: true })
      }

      await updateOrgPlan(orgId, "pro")
      await db.from("organizations")
        .update({ paystack_customer_code: customerCode })
        .eq("id", orgId)
    }

    if (payload.event === "subscription.disable") {
      const e = payload as SubscriptionDisable
      // Prefer DB-rooted customer_code lookup; fall back to metadata
      const orgId = await orgIdFromCustomerCode(e.data.customer.customer_code)
        ?? e.data.metadata.organization_id
      if (!orgId) {
        Sentry.captureMessage("Paystack webhook: could not resolve org for subscription.disable", { level: "warning" })
        return Response.json({ ok: true })
      }
      await updateOrgPlan(orgId, "starter")
    }

    if (payload.event === "invoice.payment_failed") {
      const e = payload as InvoicePaymentFailed
      // Prefer DB-rooted customer_code lookup; fall back to subscription metadata
      // Note: verify exact payload path against live Paystack events when activating payments
      const orgId = (e.data.customer?.customer_code
        ? await orgIdFromCustomerCode(e.data.customer.customer_code)
        : undefined)
        ?? e.data.subscription?.metadata?.organization_id
      if (!orgId) {
        Sentry.captureMessage("Paystack webhook: could not resolve org for invoice.payment_failed", { level: "warning" })
        return Response.json({ ok: true })
      }
      await updateOrgPlan(orgId, "starter")
    }

    return Response.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    return Response.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
