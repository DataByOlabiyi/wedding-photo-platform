import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin } from '@/lib/pin-utils'

describe('hashPin', () => {
  it('produces a string in <32-hex-salt>:<64-hex-digest> format', async () => {
    const hash = await hashPin('1234')
    const parts = hash.split(':')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/)
    expect(parts[1]).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for the same PIN (random salt)', async () => {
    const h1 = await hashPin('1234')
    const h2 = await hashPin('1234')
    expect(h1).not.toBe(h2)
  })
})

describe('verifyPin', () => {
  it('returns true for the correct PIN', async () => {
    const stored = await hashPin('5678')
    expect(await verifyPin('5678', stored)).toBe(true)
  })

  it('returns false for an incorrect PIN', async () => {
    const stored = await hashPin('5678')
    expect(await verifyPin('0000', stored)).toBe(false)
  })

  it('returns false for a PIN that differs by one digit', async () => {
    const stored = await hashPin('1234')
    expect(await verifyPin('1235', stored)).toBe(false)
  })

  it('returns false for an empty stored hash', async () => {
    expect(await verifyPin('1234', '')).toBe(false)
  })

  it('returns false for a stored hash with no colon separator', async () => {
    expect(await verifyPin('1234', 'invalidstoredvalue')).toBe(false)
  })

  it('returns false for a stored hash with empty salt', async () => {
    expect(await verifyPin('1234', ':somedigest')).toBe(false)
  })

  it('returns false for a stored hash with empty digest', async () => {
    expect(await verifyPin('1234', 'somesalt:')).toBe(false)
  })

  it('is constant-time: does not short-circuit on first differing character', async () => {
    // This test cannot verify timing directly in a unit test, but it confirms
    // that a crafted stored value with the same length does not cause a wrong true.
    const stored = await hashPin('1111')
    const [salt] = stored.split(':')
    // Construct a stored hash with same salt but wrong (all-zero) digest
    const fakeStored = `${salt}:${'0'.repeat(64)}`
    expect(await verifyPin('1111', fakeStored)).toBe(false)
  })
})
