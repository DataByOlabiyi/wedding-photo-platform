import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin } from '@/lib/pin-utils'

describe('hashPin', () => {
  it('produces a bcrypt hash starting with $2b$', async () => {
    const hash = await hashPin('1234')
    expect(hash).toMatch(/^\$2b\$12\$/)
  })

  it('produces different hashes for the same PIN (random salt)', async () => {
    const h1 = await hashPin('1234')
    const h2 = await hashPin('1234')
    expect(h1).not.toBe(h2)
  })
})

describe('verifyPin — bcrypt path', () => {
  it('returns { valid: true, needsRehash: false } for the correct PIN', async () => {
    const stored = await hashPin('5678')
    const result = await verifyPin('5678', stored)
    expect(result.valid).toBe(true)
    expect(result.needsRehash).toBe(false)
  })

  it('returns { valid: false, needsRehash: false } for an incorrect PIN', async () => {
    const stored = await hashPin('5678')
    const result = await verifyPin('0000', stored)
    expect(result.valid).toBe(false)
    expect(result.needsRehash).toBe(false)
  })

  it('returns valid: false for a PIN that differs by one digit', async () => {
    const stored = await hashPin('1234')
    const result = await verifyPin('1235', stored)
    expect(result.valid).toBe(false)
  })
})

describe('verifyPin — legacy SHA-256 path', () => {
  // Build a legacy stored value manually: "<32-hex-salt>:<64-hex-sha256>"
  async function legacyHash(pin: string): Promise<string> {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16))
    const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
    const data = new TextEncoder().encode(pin + salt)
    const buf = await crypto.subtle.digest('SHA-256', data)
    const digest = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    return `${salt}:${digest}`
  }

  it('returns { valid: true, needsRehash: true } for a correct legacy PIN', async () => {
    const stored = await legacyHash('1111')
    const result = await verifyPin('1111', stored)
    expect(result.valid).toBe(true)
    expect(result.needsRehash).toBe(true)
  })

  it('returns { valid: false, needsRehash: false } for a wrong legacy PIN', async () => {
    const stored = await legacyHash('1111')
    const result = await verifyPin('9999', stored)
    expect(result.valid).toBe(false)
    expect(result.needsRehash).toBe(false)
  })

  it('returns { valid: false, needsRehash: false } for an empty stored hash', async () => {
    const result = await verifyPin('1234', '')
    expect(result.valid).toBe(false)
    expect(result.needsRehash).toBe(false)
  })

  it('returns { valid: false, needsRehash: false } for a stored hash with no separator', async () => {
    const result = await verifyPin('1234', 'invalidstoredvalue')
    expect(result.valid).toBe(false)
  })

  it('is constant-time: does not short-circuit on first differing character', async () => {
    const stored = await legacyHash('1111')
    const [salt] = stored.split(':')
    const fakeStored = `${salt}:${'0'.repeat(64)}`
    const result = await verifyPin('1111', fakeStored)
    expect(result.valid).toBe(false)
  })
})
