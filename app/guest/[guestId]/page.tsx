"use client"

import { useState, use, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, Camera, Play, User, Plus, Loader2, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MediaLightbox } from "@/components/media-lightbox"
import { useSearchParams } from "next/navigation"
import { usePaginatedGuestMedia } from "@/hooks/use-paginated-media"
import { downloadGuestZip } from "@/lib/zip-download"
import { guestSelfDeleteMedia } from "@/app/actions/guest-self-delete"
import { toast } from "sonner"
import type { MediaItem } from "@/lib/types"

const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, matches server action

function isWithinDeleteWindow(uploadedAt: string): boolean {
  return Date.now() - new Date(uploadedAt).getTime() < DELETE_WINDOW_MS
}

export default function GuestPage({ params }: { params: Promise<{ guestId: string }> }) {
  const resolvedParams = use(params)
  const decodedGuestId = decodeURIComponent(resolvedParams.guestId)
  const searchParams = useSearchParams()
  const { media: guestMedia, isLoading, removeMedia } = usePaginatedGuestMedia(decodedGuestId)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const deepLinkHandled = useRef(false)

  // Open lightbox on load when ?photo=<id> is in the URL
  useEffect(() => {
    if (deepLinkHandled.current || isLoading || guestMedia.length === 0) return
    const photoId = searchParams.get("photo")
    if (!photoId) return
    const idx = guestMedia.findIndex((m) => m.id === photoId)
    if (idx !== -1) {
      setSelectedIndex(idx)
      deepLinkHandled.current = true
    }
  }, [searchParams, guestMedia, isLoading])

  const handleDownloadAll = async () => {
    if (guestMedia.length === 0) return
    setIsDownloading(true)
    try {
      await downloadGuestZip(guestMedia, decodedGuestId)
    } catch (error) {
      console.error('Download error:', error)
      toast.error("Download failed", { description: "Could not download photos. Please try again." })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    const result = await guestSelfDeleteMedia(item.id, decodedGuestId, item.uploaded_at)
    if (result.success) {
      removeMedia(item.id)
      if (selectedIndex !== null) setSelectedIndex(null)
      toast.success("Photo deleted", { description: "Your photo has been removed." })
    } else {
      toast.error("Delete failed", { description: result.error || "Could not delete photo." })
    }
  }

  const initials = decodedGuestId
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Skeleton className="h-6 w-16" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-10 flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </main>
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
              onClick={handleDownloadAll}
              disabled={isDownloading}
              variant="outline"
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isDownloading ? "Downloading..." : "Download All"}
              </span>
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
            {decodedGuestId}
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
                onDelete={isWithinDeleteWindow(item.uploaded_at) ? () => handleDelete(item) : undefined}
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
          onDeleted={(id) => { removeMedia(id); setSelectedIndex(null) }}
          currentIndex={selectedIndex}
          totalCount={guestMedia.length}
        />
      )}
    </div>
  )
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "expired"
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m left`
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${m}m ${s}s left`
}

function MediaThumbnail({
  item,
  onClick,
  onDelete,
}: {
  item: MediaItem
  onClick: () => void
  onDelete?: () => void
}) {
  const isVideo = item.media_type === "video"
  const [msRemaining, setMsRemaining] = useState(
    () => DELETE_WINDOW_MS - (Date.now() - new Date(item.uploaded_at).getTime())
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!onDelete || msRemaining <= 0) return
    intervalRef.current = setInterval(() => {
      const ms = DELETE_WINDOW_MS - (Date.now() - new Date(item.uploaded_at).getTime())
      setMsRemaining(ms)
      if (ms <= 0 && intervalRef.current) clearInterval(intervalRef.current)
    }, 10_000) // update every 10 s — no need for second precision on thumbnail
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [item.uploaded_at, onDelete, msRemaining])

  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition-all duration-300 hover:ring-primary/50 hover:shadow-lg">
      <button
        onClick={onClick}
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

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </button>

      {/* Delete button + countdown — only within delete window */}
      {onDelete && msRemaining > 0 && (
        <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
            aria-label="Delete photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5">
            <Clock className="h-2.5 w-2.5 text-white/70" />
            <span className="text-[10px] text-white/80 whitespace-nowrap">{formatTimeRemaining(msRemaining)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
