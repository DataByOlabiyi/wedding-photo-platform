import bcrypt from 'bcryptjs'
import type { VerifyPinResult } from '@/lib/types'

const BCRYPT_ROUNDS = 12

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS)
}

// Detects legacy SHA-256 format ("<32-char hex salt>:<64-char hex digest>") and
// returns needsRehash=true on a successful match so the caller can upgrade transparently.
export async function verifyPin(pin: string, stored: string): Promise<VerifyPinResult> {
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    const valid = await bcrypt.compare(pin, stored)
    return { valid, needsRehash: false }
  }

  // Legacy SHA-256 path — constant-time comparison
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return { valid: false, needsRehash: false }
  const actual = await sha256Hex(pin + salt)
  if (actual.length !== expected.length) return { valid: false, needsRehash: false }
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  const valid = diff === 0
  return { valid, needsRehash: valid }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
