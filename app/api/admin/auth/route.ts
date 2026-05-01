import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this')

export async function POST(request: Request) {
  const { password } = await request.json()

  // Debug logging (remove after testing)
  console.log('[v0] Auth attempt - Password provided:', !!password)
  console.log('[v0] Auth - ADMIN_PASSWORD env var set:', !!ADMIN_PASSWORD)
  console.log('[v0] Auth - Password matches:', password === ADMIN_PASSWORD)

  // Validate password against server-side env var (never exposed to client)
  if (!password || password !== ADMIN_PASSWORD) {
    console.log('[v0] Auth failed - Invalid password or env var not set')
    return Response.json({ error: 'Invalid password. Check server logs.' }, { status: 401 })
  }

  // Create a signed JWT token
  const token = await new SignJWT({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  // Set httpOnly cookie with the token
  const cookieJar = await cookies()
  cookieJar.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  return Response.json({ success: true })
}
