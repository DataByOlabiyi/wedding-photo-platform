'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
interface UploadSuccessProps {
  guestId: string
  guestName: string
  eventSlug: string
  photoCount: number
  coupleNames: string
}

export function UploadSuccess({ guestId, guestName, eventSlug, photoCount, coupleNames }: UploadSuccessProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Uploaded</p>
          <h2 className="font-serif text-heading">Thank you, {guestName.split(" ")[0]}.</h2>
          <p className="text-body text-muted-foreground">
            Your <span className="font-mono text-foreground">{photoCount}</span> {photoCount === 1 ? "photo is" : "photos are"} now part of {coupleNames}&rsquo;s gallery.
          </p>
        </div>

        <div className="mx-auto h-px w-16 bg-border" />

        <div className="flex flex-col gap-3">
          <Link href={`/guest/${guestId}`} className="w-full">
            <Button size="lg" className="h-12 w-full">
              See your photos
            </Button>
          </Link>

          <Link href={`/e/${eventSlug}`} className="w-full">
            <Button size="lg" variant="outline" className="h-12 w-full">
              Upload more
            </Button>
          </Link>
        </div>

        <Link href="/" className="inline-flex min-h-11 items-center text-caption text-muted-foreground transition-colors hover:text-foreground">
          Powered by SnapEvent
        </Link>
      </div>
    </div>
  )
}
