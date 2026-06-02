'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { FolderGrid } from '@/components/folder-grid'
import type { MediaItem } from '@/lib/types'

const GALLERY_TOKEN = process.env.NEXT_PUBLIC_GALLERY_TOKEN || ''

export default function GalleryPage({ params }: { params: { token: string } }) {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verify token
    if (params.token !== GALLERY_TOKEN) {
      setIsValid(false)
      setIsLoading(false)
      return
    }

    setIsValid(true)

    // Fetch media
    const fetchMedia = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })

      if (!error && data) {
        setMedia(data as MediaItem[])
      }
      setIsLoading(false)
    }

    fetchMedia()
  }, [params.token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-serif text-lg text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (isValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-3xl">Gallery Not Found</h1>
          <p className="text-muted-foreground">
            This gallery link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  const totalPhotos = media.length
  const totalGuests = new Set(media.map((m) => m.uploaded_by)).size

  return (
    <div className="min-h-screen bg-background">
      <Header hideUploadButton />

      <main>
        <Hero totalPhotos={totalPhotos} totalGuests={totalGuests} />

        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Guest Albums
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View photos from our special day
            </p>
          </div>

          <FolderGrid />
        </section>
      </main>
    </div>
  )
}
