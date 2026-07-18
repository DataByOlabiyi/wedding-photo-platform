'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="truncate font-serif text-lg tracking-tight">{coupleNames ?? eventName}</span>
          {weddingDate && (
            <span className="shrink-0 font-mono text-data text-muted-foreground">
              {new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-secondary/25 py-12 text-center">
          {loading ? (
            <div className="flex justify-center gap-8">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
            </div>
          ) : (
            <div className="flex justify-center gap-12">
              <div>
                <p className="font-mono text-3xl font-medium text-foreground sm:text-4xl">{stats.totalPhotos}</p>
                <p className="mt-1 text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Photos</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-medium text-foreground sm:text-4xl">{stats.totalGuests}</p>
                <p className="mt-1 text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Guests</p>
              </div>
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 font-serif text-heading">Guest albums</h2>
          <FolderGrid />
        </section>
      </main>
    </div>
  )
}
