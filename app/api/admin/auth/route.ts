import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this')

export async function POST(request: Request) {
  const { password } = await request.json()

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
