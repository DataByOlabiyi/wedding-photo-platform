'use client'

import { CheckCircle, ArrowRight, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UploadSuccessProps {
  guestId: string
  guestName: string
  photoCount: number
}

export function UploadSuccess({ guestId, guestName, photoCount }: UploadSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Checkmark animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full" />
            <CheckCircle className="h-24 w-24 text-primary relative" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="font-serif text-3xl font-semibold text-foreground">
            Photos Uploaded!
          </h2>
          <p className="text-lg text-muted-foreground">
            {photoCount} photo{photoCount > 1 ? 's' : ''} from {guestName} added to the gallery.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link href={`/guest/${guestId}`} className="w-full">
            <Button size="lg" className="w-full gap-2">
              <ArrowRight className="h-5 w-5" />
              See Your Photos
            </Button>
          </Link>

          <Link href="/upload" className="w-full">
            <Button size="lg" variant="outline" className="w-full gap-2">
              <UploadCloud className="h-5 w-5" />
              Upload More
            </Button>
          </Link>
        </div>

        {/* Back to home */}
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to gallery
        </Link>
      </div>
    </div>
  )
}
