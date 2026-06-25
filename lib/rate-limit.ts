import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isProduction = process.env.NODE_ENV === 'production'

// In production only x-vercel-forwarded-for is trusted — it is set by Vercel's
// infrastructure and cannot be spoofed by the client. x-forwarded-for is
// client-controlled and must not be used as a rate-limit key in production.
export function getIp(headers: { get(name: string): string | null }): string {
  if (isProduction) {
    return headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  }
  return (
    headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

const hasUpstashConfig =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

let ratelimit: Ratelimit | null = null
let adminRatelimit: Ratelimit | null = null
let pinRatelimit: Ratelimit | null = null
let emailNotificationRatelimit: Ratelimit | null = null

if (hasUpstashConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  ratelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'upload-rate-limit',
    limiter: Ratelimit.slidingWindow(60, '1 h'),
  })

  adminRatelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'admin-auth-rate-limit',
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  })

  pinRatelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'pin-rate-limit',
    limiter: Ratelimit.slidingWindow(10, '15 m'),
  })

  emailNotificationRatelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'email-notification-rate-limit',
    limiter: Ratelimit.slidingWindow(5, '1 h'),
  })
}

// Development-only in-memory fallback (single process, no concurrency concerns)
const inMemoryLimits = new Map<string, { count: number; resetTime: number }>()
const inMemoryAdminLimits = new Map<string, { count: number; resetTime: number }>()
const inMemoryPinLimits = new Map<string, { count: number; resetTime: number }>()
const inMemoryEmailLimits = new Map<string, { count: number; resetTime: number }>()

export async function checkUploadRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  // Guard at request-time so the build succeeds without Upstash env vars.
  if (isProduction && !ratelimit) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. ' +
      'The in-memory fallback does not work across serverless instances.'
    )
  }

  if (ratelimit) {
    try {
      const { success, remaining, reset } = await ratelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining), resetTime: reset }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail closed in production — do not allow if Redis is unreachable
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 60 }
    }
  }

  // In-memory fallback — development only
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const userLimit = inMemoryLimits.get(ip)

  if (userLimit && now < userLimit.resetTime) {
    if (userLimit.count >= 60) return { allowed: false, remaining: 0, resetTime: userLimit.resetTime }
    inMemoryLimits.set(ip, { count: userLimit.count + 1, resetTime: userLimit.resetTime })
    const remaining = Math.max(0, 60 - userLimit.count - 1)
    return { allowed: true, remaining, resetTime: userLimit.resetTime }
  }

  inMemoryLimits.set(ip, { count: 1, resetTime: now + hourMs })
  return { allowed: true, remaining: 59, resetTime: now + hourMs }
}

export async function checkAdminRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (adminRatelimit) {
    try {
      const { success, remaining } = await adminRatelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining) }
    } catch (error) {
      console.error('Admin rate limit check failed:', error)
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 5 }
    }
  }

  // In-memory fallback — development only (5 attempts per 15 min)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const entry = inMemoryAdminLimits.get(ip)

  if (entry && now < entry.resetTime) {
    if (entry.count >= 5) return { allowed: false, remaining: 0 }
    inMemoryAdminLimits.set(ip, { count: entry.count + 1, resetTime: entry.resetTime })
    return { allowed: true, remaining: 5 - entry.count - 1 }
  }

  inMemoryAdminLimits.set(ip, { count: 1, resetTime: now + windowMs })
  return { allowed: true, remaining: 4 }
}

export async function checkPinRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (pinRatelimit) {
    try {
      const { success, remaining } = await pinRatelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining) }
    } catch (error) {
      console.error('PIN rate limit check failed:', error)
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 10 }
    }
  }

  // In-memory fallback — development only (10 attempts per 15 min)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const entry = inMemoryPinLimits.get(ip)

  if (entry && now < entry.resetTime) {
    if (entry.count >= 10) return { allowed: false, remaining: 0 }
    inMemoryPinLimits.set(ip, { count: entry.count + 1, resetTime: entry.resetTime })
    return { allowed: true, remaining: 10 - entry.count - 1 }
  }

  inMemoryPinLimits.set(ip, { count: 1, resetTime: now + windowMs })
  return { allowed: true, remaining: 9 }
}

export async function checkEmailNotificationRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (isProduction && !emailNotificationRatelimit) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production.'
    )
  }

  if (emailNotificationRatelimit) {
    try {
      const { success, remaining } = await emailNotificationRatelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining) }
    } catch (error) {
      console.error('Email notification rate limit check failed:', error)
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 5 }
    }
  }

  // In-memory fallback — development only (5 per hour)
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const entry = inMemoryEmailLimits.get(ip)

  if (entry && now < entry.resetTime) {
    if (entry.count >= 5) return { allowed: false, remaining: 0 }
    inMemoryEmailLimits.set(ip, { count: entry.count + 1, resetTime: entry.resetTime })
    return { allowed: true, remaining: 5 - entry.count - 1 }
  }

  inMemoryEmailLimits.set(ip, { count: 1, resetTime: now + hourMs })
  return { allowed: true, remaining: 4 }
}
