import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis for rate limiting
// Falls back to in-memory rate limiting in development if env vars are not set
let ratelimit: Ratelimit | null = null

// Only initialize Upstash if both env vars are set AND have valid URLs
const hasUpstashConfig = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('your-upstash-url')

if (hasUpstashConfig) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    ratelimit = new Ratelimit({
      redis,
      analytics: false,
      prefix: 'upload-rate-limit',
      limiter: Ratelimit.slidingWindow(30, '1 h'), // 30 files per hour per IP
    })
  } catch (error) {
    console.warn('[v0] Failed to initialize Upstash rate limiting, falling back to in-memory:', error)
  }
}

// Fallback in-memory rate limiting for development
const inMemoryLimits = new Map<string, { count: number; resetTime: number }>()

export async function checkUploadRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  if (ratelimit) {
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)
      return {
        allowed: success,
        remaining: Math.max(0, remaining),
        resetTime: reset,
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // On error, allow the request (fail open)
      return { allowed: true, remaining: 30 }
    }
  }

  // In-memory fallback
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const userLimit = inMemoryLimits.get(ip)

  if (userLimit && now < userLimit.resetTime) {
    const remaining = Math.max(0, 30 - userLimit.count)
    return {
      allowed: remaining > 0,
      remaining,
      resetTime: userLimit.resetTime,
    }
  }

  inMemoryLimits.set(ip, { count: 1, resetTime: now + hourMs })
  return { allowed: true, remaining: 29, resetTime: now + hourMs }
}
