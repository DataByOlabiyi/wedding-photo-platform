// PIN hashing using Web Crypto (SHA-256 + random salt).
// Stored format: "<32-char hex salt>:<64-char sha256 hex>"
// A PIN is a 4–6 digit code; this is sufficient for protecting casual access
// from the DB. The salt prevents rainbow-table attacks across events.

export async function hashPin(pin: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const digest = await sha256Hex(pin + salt)
  return `${salt}:${digest}`
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = await sha256Hex(pin + salt)
  // Constant-time comparison to avoid timing attacks
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
