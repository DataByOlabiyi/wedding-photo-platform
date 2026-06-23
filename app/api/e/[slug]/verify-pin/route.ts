import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPin } from '@/lib/pin-utils'
import { checkPinRateLimit } from '@/lib/rate-limit'
import { setPinCookie } from '@/lib/pin-cookie'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // x-vercel-forwarded-for is set by Vercel's infrastructure and cannot be
  // spoofed by the client — unlike x-forwarded-for which is client-controlled.
  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'

  const { allowed } = await checkPinRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many PIN attempts. Try again later.' },
      { status: 429 }
    )
  }

  const { slug } = await params
  const { pin } = await request.json()

  if (!pin || typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: event } = await db
    .from('events')
    .select('id, pin_hash')
    .eq('slug', slug)
    .single()

  if (!event || !event.pin_hash) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const valid = await verifyPin(pin, event.pin_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  await setPinCookie(response, event.id)
  return response
}
