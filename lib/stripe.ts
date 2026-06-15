import Stripe from 'stripe'

// Singleton Stripe client — throw early if the key is missing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const PLANS = {
  starter: {
    label: 'Starter',
    priceId: null, // free tier
    features: ['1 event', '200 photos per event', 'Individual photo download'],
  },
  pro: {
    label: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    features: [
      'Unlimited events',
      'Unlimited photos',
      'Bulk ZIP download',
      'Event PIN protection',
      'Guest email collection',
    ],
  },
} as const

export type Plan = keyof typeof PLANS
