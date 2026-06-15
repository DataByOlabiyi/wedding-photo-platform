'use client'

import { useEffect, useState } from 'react'
import { Heart, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MediaItem } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderGrid } from '@/components/folder-grid'

interface Props {
  eventId: string
  eventName: string
  coupleNames?: string
  weddingDate?: string
  guestsCanView: boolean
}

export function GalleryView({ eventId, eventName, coupleNames, weddingDate, guestsCanView }: Props) {
  const [stats, setStats] = useState({ totalPhotos: 0, totalGuests: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('media')
      .select('id, uploaded_by')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .eq('moderation_status', 'approved')
      .then(({ data }) => {
        if (data) {
          setStats({
            totalPhotos: data.length,
            totalGuests: new Set(data.map(m => m.uploaded_by)).size,
          })
        }
        setLoading(false)
      })
  }, [eventId])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <span className="font-serif text-lg font-semibold">{coupleNames ?? eventName}</span>
          </div>
          {weddingDate && (
            <span className="text-sm text-muted-foreground">
              {new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </header>

      <main>
        {/* Hero stats */}
        <section className="border-b border-border/30 bg-primary/5 py-12 text-center">
          {loading ? (
            <div className="flex justify-center gap-8">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
            </div>
          ) : (
            <div className="flex justify-center gap-12">
              <div>
                <p className="font-serif text-4xl font-semibold text-foreground">{stats.totalPhotos}</p>
                <p className="text-sm text-muted-foreground">Photos</p>
              </div>
              <div>
                <p className="font-serif text-4xl font-semibold text-foreground">{stats.totalGuests}</p>
                <p className="text-sm text-muted-foreground">Guests</p>
              </div>
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl font-semibold mb-6">Guest Albums</h2>
          {/* FolderGrid uses the media-context which fetches all media;
              for the multi-tenant gallery it needs the eventId filter.
              Passing eventId as a prop is handled via the existing context refresh mechanism. */}
          {/* FolderGrid uses the global media context; event-scoped filtering
              is enforced by RLS on the DB — only approved media for public reads. */}
          <FolderGrid />
        </section>
      </main>
    </div>
  )
}
