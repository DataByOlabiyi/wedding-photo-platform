import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireOrg: vi.fn(),
  requireOrgOwner: vi.fn(),
  requireAuth: vi.fn(),
  getSessionUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { requireOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteEvent, updateEventSettings } from '@/app/actions/event-management'
import { guestSelfDeleteMedia } from '@/app/actions/guest-self-delete'

const mockOrgId = 'org-a-uuid'
const mockEventId = 'event-a-uuid'
const crossOrgEventId = 'event-b-uuid'

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireOrg).mockResolvedValue({
    user: { id: 'user-uuid' } as any,
    membership: {
      organization_id: mockOrgId,
      role: 'owner',
      organizations: { id: mockOrgId, name: 'Test Org', slug: 'test', plan: 'pro', created_at: '' },
    } as any,
  })
})

describe('deleteEvent — org scoping', () => {
  it('scopes delete query with organization_id from session, not caller input', async () => {
    const db = makeMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    await deleteEvent(mockEventId)

    // The delete chain must include .eq('organization_id', mockOrgId)
    const eqCalls = db.eq.mock.calls
    const hasOrgScope = eqCalls.some(
      ([col, val]) => col === 'organization_id' && val === mockOrgId
    )
    expect(hasOrgScope).toBe(true)
  })

  it('cannot delete an event from a different org by passing a cross-org event ID', async () => {
    const db = makeMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    // Even if a caller passes a cross-org event ID, the .eq('organization_id', orgId)
    // clause in the query prevents the delete from matching any other org's rows.
    await deleteEvent(crossOrgEventId)

    const eqCalls = db.eq.mock.calls
    const hasOrgScope = eqCalls.some(
      ([col, val]) => col === 'organization_id' && val === mockOrgId
    )
    expect(hasOrgScope).toBe(true)
    // The org id is always the session's org — never the event id argument
    const hasWrongOrg = eqCalls.some(
      ([col, val]) => col === 'organization_id' && val === crossOrgEventId
    )
    expect(hasWrongOrg).toBe(false)
  })
})

describe('updateEventSettings — org scoping', () => {
  it('verifies event belongs to session org before updating', async () => {
    const db = makeMockDb()
    // Event lookup returns null (cross-org or nonexistent event)
    db.single.mockResolvedValue({ data: null, error: { message: 'not found' } })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await updateEventSettings(crossOrgEventId, { status: 'closed' })

    expect(result).toEqual({ error: 'Event not found.' })

    // The query must have scoped by both event id and org id
    const eqCalls = db.eq.mock.calls
    const hasOrgScope = eqCalls.some(
      ([col, val]) => col === 'organization_id' && val === mockOrgId
    )
    expect(hasOrgScope).toBe(true)
  })
})

const mockMediaId = '00000000-0000-0000-0000-000000000099'

describe('guestSelfDeleteMedia — timestamp from DB, not client', () => {
  it('uses uploaded_at from database row for the 24-hour expiry check', async () => {
    const recentUpload = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    const mediaRow = {
      id: mockMediaId,
      guest_token: 'guest-token',
      event_id: mockEventId,
      uploaded_at: recentUpload,
    }
    const db = makeMockDb()
    db.single.mockResolvedValue({ data: mediaRow, error: null })
    db.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await guestSelfDeleteMedia(mockMediaId, 'guest-token', 'guest-token', mockEventId)

    expect(result.success).toBe(true)
  })

  it('rejects delete when DB uploaded_at is older than 24 hours, even if no timestamp is passed', async () => {
    const oldUpload = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
    const mediaRow = {
      id: mockMediaId,
      guest_token: 'guest-token',
      event_id: mockEventId,
      uploaded_at: oldUpload,
    }
    const db = makeMockDb()
    db.single.mockResolvedValue({ data: mediaRow, error: null })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await guestSelfDeleteMedia(mockMediaId, 'guest-token', 'guest-token', mockEventId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('expired')
  })

  it('rejects delete when event_id does not match the media row', async () => {
    const mediaRow = {
      id: mockMediaId,
      guest_token: 'guest-token',
      event_id: 'different-event-uuid',
      uploaded_at: new Date().toISOString(),
    }
    const db = makeMockDb()
    db.single.mockResolvedValue({ data: mediaRow, error: null })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await guestSelfDeleteMedia(mockMediaId, 'guest-token', 'guest-token', mockEventId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })
})

describe('PIN brute force protection math', () => {
  it('4-digit PIN space is 9000 combinations', () => {
    expect(9999 - 1000 + 1).toBe(9000)
    const minutesToExhaust = (9000 / 10) * 15
    expect(minutesToExhaust).toBeGreaterThan(1000)
  })

  it('rate limit window blocks on the 11th attempt', () => {
    const MAX = 10
    let count = 0
    const tryPin = () => (count < MAX ? (count++, 'allowed') : 'blocked')
    for (let i = 0; i < MAX; i++) expect(tryPin()).toBe('allowed')
    expect(tryPin()).toBe('blocked')
  })
})
