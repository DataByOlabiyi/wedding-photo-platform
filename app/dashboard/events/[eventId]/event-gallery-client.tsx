"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, Loader2, Images } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MediaLightbox } from "@/components/media-lightbox"
import { downloadGuestZip } from "@/lib/zip-download"
import { toast } from "sonner"
import type { MediaItem } from "@/lib/types"

interface Props {
  eventId: string
  eventName: string
  eventSlug: string
  galleryToken: string | null
  status: string
  plan: string
  initialMedia: MediaItem[]
}

export function EventGalleryClient({ eventName, eventSlug, status, initialMedia }: Props) {
  const [media] = useState<MediaItem[]>(initialMedia)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadAll = async () => {
    if (media.length === 0) return
    setIsDownloading(true)
    try {
      await downloadGuestZip(media, eventName)
    } catch {
      toast.error("Download failed", { description: "Could not download photos. Please try again." })
    } finally {
      setIsDownloading(false)
    }
  }

  const aspectRatio = (item: MediaItem) =>
    item.width && item.height ? item.width / item.height : 3 / 4

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-serif text-2xl font-semibold">{eventName}</h1>
            <Badge variant={status === 'open' ? 'default' : 'secondary'} className="capitalize">
              {status}
            </Badge>
          </div>
          <p className="pl-10 text-sm text-muted-foreground">
            {media.length} photo{media.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          {media.length > 0 && (
            <Button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDownloading ? 'Downloading…' : 'Download All'}</span>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
            <a href={`/e/${eventSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Guest link</span>
            </a>
          </Button>
        </div>
      </div>

      {media.length > 0 && (
        <div className="columns-2 gap-1 sm:columns-3 md:columns-4 lg:columns-5">
          {media.map((item, index) => (
            <div key={item.id} className="mb-1 break-inside-avoid">
              <div
                className="group relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition-all duration-300 hover:ring-primary/50 hover:shadow-lg"
                style={{ aspectRatio: aspectRatio(item).toString() }}
              >
                <button
                  onClick={() => setSelectedIndex(index)}
                  className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="View photo"
                >
                  <Image
                    src={item.thumbnail_url || item.file_url}
                    alt="Photo"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Images className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-foreground">No photos yet</h3>
          <p className="mt-2 text-muted-foreground">Photos your guests upload will appear here.</p>
        </div>
      )}

      {selectedIndex !== null && media[selectedIndex] && (
        <MediaLightbox
          media={media[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onPrevious={() => setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() => setSelectedIndex((prev) => (prev !== null && prev < media.length - 1 ? prev + 1 : prev))}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < media.length - 1}
          currentIndex={selectedIndex}
          totalCount={media.length}
        />
      )}
    </div>
  )
}
