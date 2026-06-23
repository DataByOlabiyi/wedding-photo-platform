import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/paystack', () => ({
  verifyWebhookSignature: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { verifyWebhookSignature } from '@/lib/paystack'
import { createAdminClient } from '@/lib/supabase/admin'
import { POST } from '@/app/api/paystack/webhook/route'

function makeDb(overrides: {
  updateError?: { message: string } | null
  selectData?: { id: string } | null
  selectError?: { message: string } | null
} = {}) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  chain.single.mockResolvedValue({
    data: overrides.selectData ?? null,
    error: overrides.selectError ?? null,
  })

  chain.eq.mockImplementation(function(this: typeof chain) {
    if (overrides.updateError !== undefined) {
      Object.defineProperty(this, 'then', {
        value: (resolve: (v: { error: typeof overrides.updateError }) => void) =>
          resolve({ error: overrides.updateError ?? null }),
        configurable: true,
      })
    }
    return this
  })

  return chain
}

function makeRequest(body: object, signature: string) {
  return new Request('http://localhost/api/paystack/webhook', {
    method: 'POST',
    headers: { 'x-paystack-signature': signature },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/paystack/webhook', () => {
  it('returns 400 when signature header is missing', async () => {
    const req = new Request('http://localhost/api/paystack/webhook', {
      method: 'POST',
      body: JSON.stringify({ event: 'charge.success', data: {} }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing signature')
  })

  it('returns 400 when verifyWebhookSignature returns false', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(false)
    const req = makeRequest({ event: 'charge.success', data: {} }, 'bad-sig')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('charge.success with organization_id upgrades org to pro and stores customer_code', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)

    // select returns null (no existing customer code) — new subscriber
    const selectSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq })

    const db = {
      from: vi.fn().mockReturnValue({ select: selectMock, update: updateMock }),
    }
    vi.mocked(createAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createAdminClient>) // mock: implements only the subset of the Supabase client interface used by this handler

    const payload = {
      event: 'charge.success',
      data: {
        metadata: { organization_id: 'org-123' },
        customer: { customer_code: 'CUS_abc' },
      },
    }
    const req = makeRequest(payload, 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    expect(updateMock).toHaveBeenCalledWith({ plan: 'pro' })
    expect(updateMock).toHaveBeenCalledWith({ paystack_customer_code: 'CUS_abc' })
  })

  it('charge.success with no organization_id returns 200 without DB update', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)

    const updateMock = vi.fn()
    const db = { from: vi.fn().mockReturnValue({ update: updateMock }) }
    vi.mocked(createAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createAdminClient>) // mock: implements only the subset of the Supabase client interface used by this handler

    const payload = {
      event: 'charge.success',
      data: {
        metadata: {},
        customer: { customer_code: 'CUS_abc' },
      },
    }
    const req = makeRequest(payload, 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('subscription.disable with organization_id in metadata downgrades to starter', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)

    // customer_code lookup returns null → falls back to metadata organization_id
    const selectSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq })

    const db = { from: vi.fn().mockReturnValue({ select: selectMock, update: updateMock }) }
    vi.mocked(createAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createAdminClient>) // mock: implements only the subset of the Supabase client interface used by this handler

    const payload = {
      event: 'subscription.disable',
      data: {
        metadata: { organization_id: 'org-123' },
        customer: { customer_code: 'CUS_abc' },
      },
    }
    const req = makeRequest(payload, 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ plan: 'starter' })
  })

  it('invoice.payment_failed with organization_id in subscription.metadata downgrades to starter', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)

    // customer_code lookup returns null → falls back to subscription.metadata.organization_id
    const selectSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq })

    const db = { from: vi.fn().mockReturnValue({ select: selectMock, update: updateMock }) }
    vi.mocked(createAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createAdminClient>) // mock: implements only the subset of the Supabase client interface used by this handler

    const payload = {
      event: 'invoice.payment_failed',
      data: {
        subscription: { metadata: { organization_id: 'org-456' } },
        customer: { customer_code: 'CUS_xyz' },
      },
    }
    const req = makeRequest(payload, 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ plan: 'starter' })
  })

  it('returns 500 when DB update throws', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)

    const eqMock = vi.fn().mockResolvedValue({ error: { message: 'DB exploded' } })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    const db = { from: vi.fn().mockReturnValue({ update: updateMock }) }
    vi.mocked(createAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createAdminClient>) // mock: implements only the subset of the Supabase client interface used by this handler

    const payload = {
      event: 'charge.success',
      data: {
        metadata: { organization_id: 'org-123' },
        customer: { customer_code: 'CUS_abc' },
      },
    }
    const req = makeRequest(payload, 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Webhook processing failed')
  })
})
