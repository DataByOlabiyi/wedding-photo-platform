"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MediaItem } from "@/lib/types"

interface MediaContextType {
  media: MediaItem[]
  isLoading: boolean
  error: string | null
  fetchMedia: () => Promise<void>
  addMedia: (item: MediaItem) => void
  deleteMedia: (id: string) => void
  updateMedia: (id: string, updates: Partial<MediaItem>) => void
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

export function MediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedia = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from("media")
        .select("*")
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false })

      if (fetchError) throw fetchError
      setMedia(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch media")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addMedia = useCallback((item: MediaItem) => {
    setMedia((prev) => [item, ...prev])
  }, [])

  const deleteMedia = useCallback((id: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateMedia = useCallback((id: string, updates: Partial<MediaItem>) => {
    setMedia((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    fetchMedia()

    const supabase = createClient()
    const channel = supabase
      .channel("media-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            addMedia(payload.new as MediaItem)
          } else if (payload.eventType === "DELETE") {
            deleteMedia((payload.old as MediaItem).id)
          } else if (payload.eventType === "UPDATE") {
            updateMedia((payload.new as MediaItem).id, payload.new as MediaItem)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMedia, addMedia, deleteMedia, updateMedia])

  return (
    <MediaContext.Provider
      value={{
        media,
        isLoading,
        error,
        fetchMedia,
        addMedia,
        deleteMedia,
        updateMedia,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}
