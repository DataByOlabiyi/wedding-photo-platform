import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { EventUploadForm } from '@/components/event-upload-form'
import { verifyPinCookie } from '@/lib/pin-cookie'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EventUploadPage({ params }: Props) {
  const { slug } = await params
  const db = createAdminClient()

  const { data: event } = await db
    .from('events')
    .select('id, name, couple_names, wedding_date, status, closes_at, pin_hash, guests_can_view_gallery')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  // Check if uploads are closed
  const isClosed =
    event.status !== 'open' ||
    (event.closes_at && new Date(event.closes_at) < new Date())

  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="font-serif text-2xl font-semibold">Uploads closed</h1>
          <p className="text-muted-foreground text-sm">
            The photo upload window for this event has ended. Thank you for being part of the celebration!
          </p>
        </div>
      </div>
    )
  }

  // PIN gate: if event has a PIN, check for a signed verified cookie
  if (event.pin_hash) {
    const cookieStore = await cookies()
    const verified = await verifyPinCookie(cookieStore, event.id)
    if (!verified) {
      redirect(`/e/${slug}/pin`)
    }
  }

  return (
    <EventUploadForm
      eventId={event.id}
      eventSlug={slug}
      eventName={event.name}
      coupleNames={event.couple_names ?? undefined}
      weddingDate={event.wedding_date ?? undefined}
    />
  )
}
