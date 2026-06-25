import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPin, hashPin } from '@/lib/pin-utils'
import { checkPinRateLimit, getIp } from '@/lib/rate-limit'
import { setPinCookie } from '@/lib/pin-cookie'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getIp(request.headers)

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

  const { valid, needsRehash } = await verifyPin(pin, event.pin_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  if (needsRehash) {
    const newHash = await hashPin(pin)
    await db.from('events').update({ pin_hash: newHash }).eq('id', event.id).then(
      () => {},
      (err) => console.error('PIN rehash failed:', err)
    )
  }

  const response = NextResponse.json({ success: true })
  await setPinCookie(response, event.id)
  return response
}
