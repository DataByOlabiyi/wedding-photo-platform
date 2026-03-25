"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, Camera, Play, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMedia } from "@/lib/media-context"
import { MediaLightbox } from "@/components/media-lightbox"
import type { MediaItem } from "@/lib/types"

export default function GuestMediaPage() {
  const params = useParams()
  const guestId = decodeURIComponent(params.guestId as string)
  const { media, isLoading } = useMedia()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const guestMedia = useMemo(() => {
    return media
      .filter((item) => item.uploaded_by === guestId)
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
  }, [media, guestId])

  const handleDownloadAll = async () => {
    for (const item of guestMedia) {
      const response = await fetch(item.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${guestId}-${item.id}.${item.media_type === "video" ? "mp4" : "jpg"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  const initials = guestId
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-serif text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </Link>
          
          {guestMedia.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="gap-2 rounded-full"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download All</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Guest Info Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {initials || <User className="h-8 w-8" />}
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground md:text-4xl">
            {guestId}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {guestMedia.length} photo{guestMedia.length !== 1 ? "s" : ""} shared
          </p>
        </div>

        {/* Photo Grid */}
        {guestMedia.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {guestMedia.map((item, index) => (
              <MediaThumbnail
                key={item.id}
                item={item}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-foreground">
              No Photos Found
            </h3>
            <p className="mt-2 text-muted-foreground">
              This guest hasn&apos;t shared any photos yet.
            </p>
            <Link href="/">
              <Button className="mt-6 rounded-full">Back to Gallery</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <Link
        href="/upload"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95 md:bottom-8 md:right-8 md:h-16 md:w-16"
        aria-label="Upload photos"
      >
        <Plus className="h-7 w-7 md:h-8 md:w-8" />
      </Link>

      {/* Lightbox */}
      {selectedIndex !== null && guestMedia[selectedIndex] && (
        <MediaLightbox
          media={guestMedia[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onPrevious={() => setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() => setSelectedIndex((prev) => (prev !== null && prev < guestMedia.length - 1 ? prev + 1 : prev))}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < guestMedia.length - 1}
          currentIndex={selectedIndex}
          totalCount={guestMedia.length}
        />
      )}
    </div>
  )
}

function MediaThumbnail({
  item,
  onClick,
}: {
  item: MediaItem
  onClick: () => void
}) {
  const isVideo = item.media_type === "video"

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition-all duration-300 hover:ring-primary/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Image
        src={item.thumbnail_url || item.file_url}
        alt="Photo"
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
      />
      
      {/* Video Overlay */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
    </button>
  )
}
