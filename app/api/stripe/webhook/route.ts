import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

// Stripe requires the raw body for signature verification.
export const config = { api: { bodyParser: false } }

async function updateOrgPlan(orgId: string, plan: 'starter' | 'pro') {
  const db = createAdminClient()
  await db.from('organizations').update({ plan }).eq('id', orgId)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const getOrgId = (obj: Stripe.Metadata | null): string | null =>
    obj?.organization_id ?? null

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = getOrgId(session.metadata)
      if (orgId) await updateOrgPlan(orgId, 'pro')
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = getOrgId(sub.metadata)
      if (orgId) {
        const active = sub.status === 'active' || sub.status === 'trialing'
        await updateOrgPlan(orgId, active ? 'pro' : 'starter')
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = getOrgId(sub.metadata)
      if (orgId) await updateOrgPlan(orgId, 'starter')
      break
    }
  }

  return NextResponse.json({ received: true })
}
