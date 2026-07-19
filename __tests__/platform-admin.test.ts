import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

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
  getPlatformAdminRole: vi.fn(),
  requirePlatformAdmin: vi.fn(),
  requireSuperAdmin: vi.fn(),
  assertSuperAdmin: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
  notFound: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { assertSuperAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { grantPlatformAdmin, revokePlatformAdmin } from '@/app/superadmin/actions'

// Real guard implementations — bypasses the @/lib/auth mock above while their
// dependencies (supabase clients, next/navigation) stay mocked.
let auth: typeof import('@/lib/auth')
beforeAll(async () => {
  auth = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
})

const mockUserId = 'staff-user-uuid'
const mockActorId = '11111111-1111-4111-8111-111111111111'
const mockTargetId = '22222222-2222-4222-8222-222222222222'

function mockSession(user: { id: string } | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as any)
}

function mockRoleLookup(role: 'admin' | 'superadmin' | null) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null }),
  }
  vi.mocked(createAdminClient).mockReturnValue(chain as any)
  return chain
}

function makeActionDb(overrides: Record<string, unknown> = {}) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
    ...overrides,
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requirePlatformAdmin — role boundary', () => {
  it('returns user and role for a superadmin', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('superadmin')

    const result = await auth.requirePlatformAdmin()

    expect(result.user.id).toBe(mockUserId)
    expect(result.role).toBe('superadmin')
  })

  it('returns user and role for an admin', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('admin')

    const result = await auth.requirePlatformAdmin()

    expect(result.user.id).toBe(mockUserId)
    expect(result.role).toBe('admin')
  })

  it('redirects to /dashboard for an authenticated non-staff user', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup(null)

    await expect(auth.requirePlatformAdmin()).rejects.toThrow('REDIRECT:/dashboard')
  })

  it('redirects to /auth/login when unauthenticated', async () => {
    mockSession(null)

    await expect(auth.requirePlatformAdmin()).rejects.toThrow('REDIRECT:/auth/login')
  })
})

describe('requireSuperAdmin — superadmin-only boundary', () => {
  it('passes a superadmin through and returns the user', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('superadmin')

    const user = await auth.requireSuperAdmin()

    expect(user.id).toBe(mockUserId)
  })

  it('redirects to /dashboard for an admin-tier staff user', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('admin')

    await expect(auth.requireSuperAdmin()).rejects.toThrow('REDIRECT:/dashboard')
  })

  it('redirects to /dashboard for a non-staff user', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup(null)

    await expect(auth.requireSuperAdmin()).rejects.toThrow('REDIRECT:/dashboard')
  })
})

describe('assertSuperAdmin — non-redirecting guard', () => {
  it('returns null without throwing when unauthenticated', async () => {
    mockSession(null)

    await expect(auth.assertSuperAdmin()).resolves.toBeNull()
  })

  it('returns null without throwing for an admin-tier staff user', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('admin')

    await expect(auth.assertSuperAdmin()).resolves.toBeNull()
  })

  it('returns the user for a superadmin', async () => {
    mockSession({ id: mockUserId })
    mockRoleLookup('superadmin')

    const user = await auth.assertSuperAdmin()

    expect(user?.id).toBe(mockUserId)
  })
})

describe('grantPlatformAdmin — escalation resistance', () => {
  it('inserts role admin, never superadmin, regardless of caller intent', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue({ id: mockActorId } as any)
    const db = makeActionDb()
    db.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: mockTargetId, email: 'staff@example.com' }] },
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await grantPlatformAdmin('staff@example.com')

    expect(result.error).toBeUndefined()
    const insertPayloads = db.insert.mock.calls.map(([payload]) => payload)
    expect(insertPayloads[0]).toMatchObject({
      user_id: mockTargetId,
      role: 'admin',
      granted_by: mockActorId,
    })
    const hasSuperadminInsert = insertPayloads.some(
      (payload) => payload && payload.role === 'superadmin'
    )
    expect(hasSuperadminInsert).toBe(false)
  })

  it('returns Unauthorized when assertSuperAdmin yields null', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue(null)
    const db = makeActionDb()
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await grantPlatformAdmin('staff@example.com')

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('returns an error when no account matches the email', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue({ id: mockActorId } as any)
    const db = makeActionDb()
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await grantPlatformAdmin('nobody@example.com')

    expect(result).toEqual({ error: 'No account with that email' })
    expect(db.insert).not.toHaveBeenCalled()
  })
})

describe('revokePlatformAdmin — superadmin rows are undeletable', () => {
  it('scopes the delete by user_id AND role admin', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue({ id: mockActorId } as any)
    const db = makeActionDb({
      select: vi.fn().mockResolvedValue({ data: [{ user_id: mockTargetId }], error: null }),
    })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await revokePlatformAdmin(mockTargetId)

    expect(result.error).toBeUndefined()
    const eqCalls = db.eq.mock.calls
    const hasUserScope = eqCalls.some(([col, val]) => col === 'user_id' && val === mockTargetId)
    const hasRoleScope = eqCalls.some(([col, val]) => col === 'role' && val === 'admin')
    expect(hasUserScope).toBe(true)
    expect(hasRoleScope).toBe(true)
  })

  it('returns an error when no admin-tier row matches', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue({ id: mockActorId } as any)
    const db = makeActionDb({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await revokePlatformAdmin(mockTargetId)

    expect(result).toEqual({ error: 'Not found or not revocable' })
  })

  it('rejects a non-UUID user id before touching the database', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue({ id: mockActorId } as any)
    const db = makeActionDb()
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await revokePlatformAdmin('not-a-uuid')

    expect(result).toEqual({ error: 'Invalid user id' })
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when assertSuperAdmin yields null', async () => {
    vi.mocked(assertSuperAdmin).mockResolvedValue(null)
    const db = makeActionDb()
    vi.mocked(createAdminClient).mockReturnValue(db as any)

    const result = await revokePlatformAdmin(mockTargetId)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(db.delete).not.toHaveBeenCalled()
  })
})
