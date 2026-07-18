"use client"

import Image from "next/image"
import Link from "next/link"
import { Camera } from "lucide-react"
import { useState } from "react"
import type { GuestFolder } from "@/lib/types"

interface GuestFolderCardProps {
  folder: GuestFolder
}

export function GuestFolderCard({ folder }: GuestFolderCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/guest/${encodeURIComponent(folder.guestId)}`} className="group block">
      <div className="rounded-xl border border-border/70 bg-card p-2 transition-shadow duration-250 hover:shadow-card">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
          {folder.coverImage && !imgError ? (
            <Image
              src={folder.coverImage}
              alt={`${folder.guestName}'s photos`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Camera className="size-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute right-2 top-2 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[0.6875rem] text-foreground backdrop-blur-sm">
            {folder.photoCount}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 p-3">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-subheading leading-snug">{folder.guestName}</h3>
            {folder.guestTag && (
              <p className="mt-0.5 truncate text-caption text-muted-foreground">{folder.guestTag}</p>
            )}
          </div>
          <span className="shrink-0 text-caption font-medium underline underline-offset-4">View all</span>
        </div>
      </div>
    </Link>
  )
}
