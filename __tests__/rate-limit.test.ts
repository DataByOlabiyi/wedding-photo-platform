import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Upstash before importing the module under test
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn().mockReturnValue({})
    constructor() {}
    limit = vi.fn()
  },
}))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {}
  },
}))

describe('rate-limit in-memory fallback (no Upstash configured)', () => {
  beforeEach(() => {
    vi.resetModules()
    // Ensure Upstash env vars are absent so the module uses in-memory fallback
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    // NODE_ENV is already 'test' in Vitest — no assignment needed
  })

  it('checkUploadRateLimit allows 60 requests then blocks', async () => {
    const { checkUploadRateLimit } = await import('@/lib/rate-limit')
    const ip = `test-upload-${Date.now()}`

    for (let i = 0; i < 60; i++) {
      const result = await checkUploadRateLimit(ip)
      expect(result.allowed).toBe(true)
    }
    const blocked = await checkUploadRateLimit(ip)
    expect(blocked.allowed).toBe(false)
  })

  it('checkAdminRateLimit allows 5 requests then blocks', async () => {
    const { checkAdminRateLimit } = await import('@/lib/rate-limit')
    const ip = `test-admin-${Date.now()}`

    for (let i = 0; i < 5; i++) {
      const result = await checkAdminRateLimit(ip)
      expect(result.allowed).toBe(true)
    }
    const blocked = await checkAdminRateLimit(ip)
    expect(blocked.allowed).toBe(false)
  })

  it('checkPinRateLimit allows 10 requests then blocks', async () => {
    const { checkPinRateLimit } = await import('@/lib/rate-limit')
    const ip = `test-pin-${Date.now()}`

    for (let i = 0; i < 10; i++) {
      const result = await checkPinRateLimit(ip)
      expect(result.allowed).toBe(true)
    }
    const blocked = await checkPinRateLimit(ip)
    expect(blocked.allowed).toBe(false)
  })

  it('different IPs have independent counters', async () => {
    const { checkPinRateLimit } = await import('@/lib/rate-limit')
    const ipA = `test-pin-a-${Date.now()}`
    const ipB = `test-pin-b-${Date.now()}`

    // Exhaust ipA
    for (let i = 0; i < 10; i++) await checkPinRateLimit(ipA)
    expect((await checkPinRateLimit(ipA)).allowed).toBe(false)

    // ipB is unaffected
    expect((await checkPinRateLimit(ipB)).allowed).toBe(true)
  })
})
