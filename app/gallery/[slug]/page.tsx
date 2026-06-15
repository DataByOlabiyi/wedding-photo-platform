import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { GalleryView } from '@/components/gallery-view'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { token } = await searchParams

  const db = createAdminClient()
  const { data: event } = await db
    .from('events')
    .select('id, name, couple_names, wedding_date, gallery_token, guests_can_view_gallery, status')
    .eq('slug', slug)
    .single()

  // Server-side token validation — no client-side env var exposure
  if (!event || !event.gallery_token || token !== event.gallery_token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="font-serif text-3xl">Gallery Not Found</h1>
          <p className="text-muted-foreground">This gallery link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (event.status === 'archived') notFound()

  return (
    <GalleryView
      eventId={event.id}
      eventName={event.name}
      coupleNames={event.couple_names ?? undefined}
      weddingDate={event.wedding_date ?? undefined}
      guestsCanView={event.guests_can_view_gallery}
    />
  )
}
