import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET_KEY = process.env.JWT_SECRET

// Validate that required env vars are set
if (!ADMIN_PASSWORD || !JWT_SECRET_KEY) {
  console.error('[v0] CRITICAL: Missing required environment variables!')
  console.error('[v0] ADMIN_PASSWORD set:', !!ADMIN_PASSWORD)
  console.error('[v0] JWT_SECRET set:', !!JWT_SECRET_KEY)
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY || '')

export async function POST(request: Request) {
  const { password } = await request.json()

  // Check if env vars are properly set
  if (!ADMIN_PASSWORD || !JWT_SECRET_KEY) {
    console.error('[v0] Auth route error: Required environment variables not set')
    return Response.json(
      { error: 'Server configuration error. Please check environment variables.' },
      { status: 500 }
    )
  }

  // Validate password against server-side env var (never exposed to client)
  if (!password || password !== ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
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
