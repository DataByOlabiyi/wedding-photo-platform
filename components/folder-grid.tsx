"use client"

import { useState, useMemo } from "react"
import { Camera, Search, X } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { useGuestFolders } from "@/hooks/use-guest-folders"
import { GuestFolderCard } from "@/components/guest-folder-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ITEMS_PER_PAGE = 12

export function FolderGrid() {
  const { refreshKey } = useMedia()
  const { guestFolders, isLoading } = useGuestFolders(refreshKey)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return guestFolders
    const q = search.toLowerCase()
    return guestFolders.filter(
      (f) =>
        f.guestName.toLowerCase().includes(q) ||
        f.guestTag?.toLowerCase().includes(q)
    )
  }, [guestFolders, search])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card">
            <div className="m-2 aspect-[4/3] animate-pulse rounded-sm bg-muted" />
            <div className="p-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (guestFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 py-20 text-center">
        <Camera className="mb-5 size-8 text-muted-foreground/40" />
        <h3 className="font-serif text-subheading">No photos yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Photos will appear here as guests share them.
        </p>
      </div>
    )
  }

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or relationship…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setDisplayCount(ITEMS_PER_PAGE) }}
          className="h-11 rounded-lg pl-9 pr-11"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-muted-foreground">No albums match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch("")} className="mt-2 flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayed.map((folder) => (
              <GuestFolderCard key={folder.guestId} folder={folder} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                variant="outline"
                className="px-8"
                size="lg"
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
