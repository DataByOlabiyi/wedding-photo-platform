"use client"

import Image from "next/image"
import Link from "next/link"
import { Camera, Clock } from "lucide-react"
import type { GuestFolder } from "@/lib/types"

interface GuestFolderCardProps {
  folder: GuestFolder
}

export function GuestFolderCard({ folder }: GuestFolderCardProps) {
  const timeAgo = getTimeAgo(folder.lastUpdated)

  return (
    <Link
      href={`/guest/${encodeURIComponent(folder.guestId)}`}
      className="group relative block overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {folder.coverImage ? (
          <Image
            src={folder.coverImage}
            alt={`${folder.guestName}'s photos`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Photo Count Badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          <Camera className="h-3 w-3" />
          <span>{folder.photoCount}</span>
        </div>
      </div>

      {/* Guest Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-serif text-xl font-semibold tracking-wide text-balance">
          {folder.guestName}
        </h3>
        {folder.guestTag && (
          <p className="mt-0.5 text-sm text-white/80">{folder.guestTag}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
