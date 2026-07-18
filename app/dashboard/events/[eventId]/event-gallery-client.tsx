"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, Loader2 } from "lucide-react"
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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard" className="-ml-2 shrink-0 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="min-w-0 truncate font-serif text-heading">{eventName}</h1>
            <Badge variant={status === 'open' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          </div>
          <p className="pl-9 font-mono text-data text-muted-foreground">
            {media.length} photo{media.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 pl-9 sm:pl-0">
          {media.length > 0 && (
            <Button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label="Download all photos"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDownloading ? 'Downloading…' : 'Download All'}</span>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-2" aria-label="Open guest upload link">
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
                className="group relative w-full overflow-hidden rounded-sm bg-muted"
                style={{ aspectRatio: aspectRatio(item).toString() }}
              >
                <button
                  onClick={() => setSelectedIndex(index)}
                  className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="View photo"
                >
                  <Image
                    src={item.thumbnail_url || item.file_url}
                    alt="Photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-150 ease-snap group-hover:bg-black/15" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <h3 className="font-serif text-subheading">No photos yet</h3>
          <p className="text-caption text-muted-foreground">Photos your guests upload will appear here. Share the guest link to get started.</p>
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
