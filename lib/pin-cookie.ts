import type { NextResponse } from 'next/server'

interface CookieReader {
  get(name: string): { value: string } | undefined
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Sets a tamper-evident PIN-verified cookie. Value is "<hmac>.<timestamp>".
// Requires PIN_COOKIE_SECRET env var — throws at startup if missing in production.
export async function setPinCookie(
  response: NextResponse,
  eventId: string
): Promise<void> {
  const secret = process.env.PIN_COOKIE_SECRET
  if (!secret) throw new Error('PIN_COOKIE_SECRET is not configured')
  const ts = Date.now().toString()
  const sig = await hmacSign(secret, `${eventId}:${ts}`)
  response.cookies.set(`pin_verified_${eventId}`, `${sig}.${ts}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: `/e/`,
  })
}

// Verifies the PIN cookie for a specific event. Returns false if missing,
// expired, or the HMAC does not match (i.e. cookie was forged or tampered with).
export async function verifyPinCookie(
  cookieStore: CookieReader,
  eventId: string
): Promise<boolean> {
  const secret = process.env.PIN_COOKIE_SECRET
  if (!secret) return false
  const value = cookieStore.get(`pin_verified_${eventId}`)?.value
  if (!value) return false
  const lastDot = value.lastIndexOf('.')
  if (lastDot === -1) return false
  const sig = value.slice(0, lastDot)
  const ts = value.slice(lastDot + 1)
  const tsNum = parseInt(ts, 10)
  if (isNaN(tsNum) || Date.now() - tsNum > MAX_AGE_MS) return false
  const expected = await hmacSign(secret, `${eventId}:${ts}`)
  // Constant-length comparison — both are base64url of the same HMAC output
  if (sig.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
