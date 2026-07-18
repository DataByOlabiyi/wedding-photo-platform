"use client"

import { useState, use, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, Download, Play, User, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MediaLightbox } from "@/components/media-lightbox"
import { useSearchParams } from "next/navigation"
import { usePaginatedGuestMedia } from "@/hooks/use-paginated-media"
import { downloadGuestZip } from "@/lib/zip-download"
import { guestSelfDeleteMedia } from "@/app/actions/guest-self-delete"
import { toast } from "sonner"
import type { MediaItem } from "@/lib/types"

const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, matches server action
const GUEST_TOKEN_KEY = 'guest_upload_token'

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
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const deepLinkHandled = useRef(false)

  // Read the guest's own upload token from localStorage (set at upload time).
  // Only used to authorise self-deletion — never sent to other users.
  useEffect(() => {
    try {
      setSessionToken(localStorage.getItem(GUEST_TOKEN_KEY))
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
  }, [])

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

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return
    setIsDeleting(true)
    const result = await guestSelfDeleteMedia(
      mediaToDelete.id,
      decodedGuestId,
      sessionToken ?? undefined,
      mediaToDelete.event_id
    )
    setIsDeleting(false)
    setMediaToDelete(null)

    if (result.success) {
      removeMedia(mediaToDelete.id)
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
          <div className="columns-2 gap-1 sm:columns-3 md:columns-4 lg:columns-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="mb-1 break-inside-avoid">
                <Skeleton className="w-full rounded-sm" style={{ aspectRatio: i % 3 === 0 ? "2/3" : i % 3 === 1 ? "4/3" : "1/1" }} />
              </div>
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
            className="flex min-h-11 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Camera className="size-4" />
            <span className="font-serif text-lg tracking-tight text-foreground">SnapEvent</span>
          </Link>

          {guestMedia.length > 0 && (
            <Button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              variant="outline"
              className="h-11 gap-2"
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
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-medium text-secondary-foreground">
            {initials || <User className="h-8 w-8" />}
          </div>
          <h1 className="font-serif text-heading">
            {decodedGuestId}
          </h1>
          <p className="mt-2 font-mono text-data text-muted-foreground">
            {guestMedia.length} photo{guestMedia.length !== 1 ? "s" : ""} shared
          </p>
        </div>

        {/* Photo Masonry Grid */}
        {guestMedia.length > 0 ? (
          <div className="columns-2 gap-1 sm:columns-3 md:columns-4 lg:columns-5">
            {guestMedia.map((item, index) => (
              <div key={item.id} className="mb-1 break-inside-avoid">
                <MediaThumbnail
                  item={item}
                  onClick={() => setSelectedIndex(index)}
                  onDelete={isWithinDeleteWindow(item.uploaded_at)
                    ? () => setMediaToDelete(item)
                    : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 py-20 text-center">
            <Camera className="mb-5 size-8 text-muted-foreground/40" />
            <h3 className="font-serif text-subheading">No photos yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This guest hasn&rsquo;t shared any photos.
            </p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
              SnapEvent home
            </Link>
          </div>
        )}
      </main>

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
          sessionToken={sessionToken}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => { if (!open) setMediaToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This photo will be removed from the gallery. Contact the couple if
              you need it restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
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
  const aspectRatio = item.width && item.height
    ? item.width / item.height
    : 3 / 4

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm bg-muted ring-1 ring-border/60 transition-shadow duration-250 hover:shadow-card"
      style={{ aspectRatio: aspectRatio.toString() }}
    >
      <button
        onClick={onClick}
        className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="View photo"
      >
        <Image
          src={item.thumbnail_url || item.file_url}
          alt="Photo"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 ring-1 ring-border">
              <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </button>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          aria-label="Delete photo"
          className="absolute bottom-0 right-0 flex size-11 items-end justify-end p-1.5"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-background/75 text-foreground/70 backdrop-blur-sm transition-colors duration-150 hover:bg-background/90 hover:text-destructive">
            <Trash2 className="size-4" />
          </span>
        </button>
      )}
    </div>
  )
}
