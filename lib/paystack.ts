import crypto from "crypto"

export const PAYSTACK_PLAN = {
  label: "Pro",
  amount: 1_900_000,
  currency: "NGN",
  features: [
    "Unlimited events",
    "Unlimited photos",
    "Bulk ZIP download",
    "Event PIN protection",
    "Guest email collection",
  ],
} as const

export type Plan = "starter" | "pro"

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set")
  return key
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET
  if (!secret) throw new Error("PAYSTACK_WEBHOOK_SECRET is not set")
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex")
  if (hash.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}
