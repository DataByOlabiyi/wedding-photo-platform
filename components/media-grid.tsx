"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Download, Heart, Loader2 } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { MediaLightbox } from "@/components/media-lightbox"
import type { MediaItem } from "@/lib/types"

export function MediaGrid() {
  const { media, isLoading, error } = useMedia()
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleMediaClick = (item: MediaItem, index: number) => {
    setSelectedMedia(item)
    setSelectedIndex(index)
  }

  const handleClose = () => {
    setSelectedMedia(null)
  }

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : media.length - 1
    setSelectedIndex(newIndex)
    setSelectedMedia(media[newIndex])
  }

  const handleNext = () => {
    const newIndex = selectedIndex < media.length - 1 ? selectedIndex + 1 : 0
    setSelectedIndex(newIndex)
    setSelectedMedia(media[newIndex])
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Unable to load media. Please try again.</p>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground">No Photos Yet</h3>
          <p className="mt-1 text-muted-foreground">
            Be the first to share a beautiful moment from the wedding!
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {media.map((item, index) => (
          <MediaGridItem
            key={item.id}
            item={item}
            onClick={() => handleMediaClick(item, index)}
          />
        ))}
      </div>

      {selectedMedia && (
        <MediaLightbox
          media={selectedMedia}
          onClose={handleClose}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={media.length > 1}
          hasNext={media.length > 1}
        />
      )}
    </>
  )
}

interface MediaGridItemProps {
  item: MediaItem
  onClick: () => void
}

function MediaGridItem({ item, onClick }: MediaGridItemProps) {
  const isVideo = item.media_type === "video"
  const thumbnailUrl = item.thumbnail_url || item.file_url

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Image
        src={thumbnailUrl}
        alt={`Photo by ${item.uploaded_by}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      />
      
      {/* Video indicator */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <Play className="h-5 w-5 text-foreground" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Info on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-primary-foreground">
          {item.uploaded_by}
        </p>
      </div>
    </button>
  )
}
