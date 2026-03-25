"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/lib/types"

interface MediaLightboxProps {
  media: MediaItem
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export function MediaLightbox({
  media,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: MediaLightboxProps) {
  const isVideo = media.media_type === "video"

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-10 text-primary-foreground hover:bg-primary-foreground/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Navigation buttons */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-8 w-8" />
          <span className="sr-only">Previous</span>
        </Button>
      )}

      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8" />
          <span className="sr-only">Next</span>
        </Button>
      )}

      {/* Media content */}
      <div className="relative max-h-[85vh] max-w-[90vw]">
        {isVideo ? (
          <video
            src={media.file_url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <Image
            src={media.file_url}
            alt={`Photo by ${media.uploaded_by}`}
            width={media.width || 1200}
            height={media.height || 800}
            className="max-h-[85vh] w-auto rounded-lg object-contain"
            priority
          />
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-12">
        <div className="flex items-center gap-2 text-primary-foreground">
          <User className="h-4 w-4" />
          <span className="text-sm">{media.uploaded_by}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  )
}
