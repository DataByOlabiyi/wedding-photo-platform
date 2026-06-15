import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPin } from '@/lib/pin-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  // Set a session cookie scoped to this event so the guest doesn't re-enter on refresh
  const response = NextResponse.json({ success: true })
  response.cookies.set(`pin_verified_${event.id}`, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return response
}
