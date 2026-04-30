"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Camera, ImagePlus } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { GuestFolderCard } from "@/components/guest-folder-card"
import { Button } from "@/components/ui/button"
import type { GuestFolder } from "@/lib/types"

export function FolderGrid() {
  const { media, isLoading } = useMedia()

  const guestFolders = useMemo(() => {
    // Group media by guest
    const folderMap = new Map<string, GuestFolder>()

    media.forEach((item) => {
      const guestId = item.uploaded_by
      const existing = folderMap.get(guestId)

      if (existing) {
        // Update photo count
        existing.photoCount += 1
        
        // Update cover image and lastUpdated if this is more recent
        const itemDate = new Date(item.uploaded_at)
        const existingDate = new Date(existing.lastUpdated)
        if (itemDate > existingDate) {
          existing.coverImage = item.thumbnail_url || item.file_url
          existing.lastUpdated = item.uploaded_at
          // Update guest tag if available
          if (item.guest_tag) {
            existing.guestTag = item.guest_tag
          }
        }
      } else {
        // Create new folder entry
        folderMap.set(guestId, {
          guestId,
          guestName: item.uploaded_by,
          guestTag: item.guest_tag || undefined,
          photoCount: 1,
          coverImage: item.thumbnail_url || item.file_url,
          lastUpdated: item.uploaded_at,
        })
      }
    })

    // Sort by most recently updated
    return Array.from(folderMap.values()).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
  }, [media])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="border-t border-border/50 p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (guestFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-foreground">
          No Photos Yet
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          Be the first to share your memories from our special day.
        </p>
        <Link href="/upload" className="mt-6">
          <Button className="gap-2 rounded-full">
            <ImagePlus className="h-4 w-4" />
            Upload Photos
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {guestFolders.map((folder) => (
        <GuestFolderCard key={folder.guestId} folder={folder} />
      ))}
    </div>
  )
}
