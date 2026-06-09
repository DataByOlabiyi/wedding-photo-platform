"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download, User, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guestSelfDeleteMedia } from "@/app/actions/guest-self-delete"
import type { MediaItem } from "@/lib/types"

const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "expired"
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${m}m ${s}s`
}

interface MediaLightboxProps {
  media: MediaItem
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  onDeleted?: (id: string) => void
  currentIndex?: number
  totalCount?: number
}

export function MediaLightbox({
  media,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onDeleted,
  currentIndex,
  totalCount,
}: MediaLightboxProps) {
  const isVideo = media.media_type === "video"
  const [isDeleting, setIsDeleting] = useState(false)
  const [msRemaining, setMsRemaining] = useState(
    () => DELETE_WINDOW_MS - (Date.now() - new Date(media.uploaded_at).getTime())
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (msRemaining <= 0) return
    intervalRef.current = setInterval(() => {
      const ms = DELETE_WINDOW_MS - (Date.now() - new Date(media.uploaded_at).getTime())
      setMsRemaining(ms)
      if (ms <= 0 && intervalRef.current) clearInterval(intervalRef.current)
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [media.uploaded_at, msRemaining])

  const canDelete = msRemaining > 0

  const handleDelete = async () => {
    if (!canDelete || !confirm("Are you sure you want to delete this photo?")) return

    setIsDeleting(true)
    try {
      const result = await guestSelfDeleteMedia(media.id, media.uploaded_by, media.uploaded_at)
      if (result.success) {
        onDeleted?.(media.id)
        onClose()
      } else {
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete photo")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" && hasPrevious) {
        onPrevious()
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext()
      }
    },
    [onClose, onPrevious, onNext, hasPrevious, hasNext]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  // Touch swipe navigation
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return // ignore small movements
    if (dx < 0 && hasNext) onNext()
    else if (dx > 0 && hasPrevious) onPrevious()
  }, [hasNext, hasPrevious, onNext, onPrevious])

  const handleDownload = async () => {
    try {
      const response = await fetch(media.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `wedding-${media.id}.${isVideo ? "mp4" : "jpg"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const initials = media.uploaded_by
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Navigation buttons */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous</span>
        </Button>
      )}

      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={onNext}
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next</span>
        </Button>
      )}

      {/* Media content */}
      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-16">
        {isVideo ? (
          <div className="relative w-full max-w-2xl">
            <video
              src={media.file_url}
              controls
              autoPlay
              muted
              className="w-full h-auto rounded-lg max-h-[70vh]"
            />
          </div>
        ) : (
          <div className="relative h-full w-full">
            <Image
              src={media.file_url}
              alt={`Photo by ${media.uploaded_by}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 sm:p-6 sm:pt-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white backdrop-blur-sm">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-medium text-white">{media.uploaded_by}</p>
            <p className="text-sm text-white/70">
              {new Date(media.uploaded_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentIndex !== undefined && totalCount !== undefined && (
            <span className="text-sm text-white/70">
              {currentIndex + 1} / {totalCount}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
            <span className="sr-only">Download</span>
          </Button>
          
          {canDelete && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                <Clock className="h-3 w-3 text-white/60" />
                <span className="text-xs text-white/70">{formatTimeRemaining(msRemaining)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive/20 text-white hover:bg-destructive/40"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete photo"
              >
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          )}

          {!canDelete && (
            <div className="text-xs text-white/40 px-2">Delete window expired</div>
          )}
        </div>
      </div>
    </div>
  )
}
