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
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm space-y-3 text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Gallery</p>
          <h1 className="font-serif text-heading">This link isn&rsquo;t working</h1>
          <p className="text-sm text-muted-foreground">The gallery link is invalid or has expired. Ask the couple for a fresh one.</p>
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
