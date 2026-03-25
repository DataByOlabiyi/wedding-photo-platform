"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useGuestIdentity } from "@/hooks/use-guest-identity"
import { useMedia } from "@/lib/media-context"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FolderGrid } from "@/components/folder-grid"
import { GuestNameModal } from "@/components/guest-name-modal"

export default function HomePage() {
  const { setGuestName, isLoading, hasIdentity } = useGuestIdentity()
  const { media } = useMedia()
  const [showNameModal, setShowNameModal] = useState(false)

  // Calculate stats
  const totalPhotos = media.length
  const totalGuests = new Set(media.map((m) => m.uploaded_by)).size

  useEffect(() => {
    if (!isLoading && !hasIdentity) {
      setShowNameModal(true)
    }
  }, [isLoading, hasIdentity])

  const handleNameSubmit = (name: string) => {
    setGuestName(name)
    setShowNameModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-serif text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero totalPhotos={totalPhotos} totalGuests={totalGuests} />

        {/* Gallery Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Guest Albums
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Click on an album to view all photos from that guest
            </p>
          </div>
          
          <FolderGrid />
        </section>
      </main>

      {/* Floating Add Button - Always visible */}
      <Link
        href="/upload"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95 md:bottom-8 md:right-8 md:h-16 md:w-16"
        aria-label="Upload photos"
      >
        <Plus className="h-7 w-7 md:h-8 md:w-8" />
      </Link>

      {showNameModal && (
        <GuestNameModal onSubmit={handleNameSubmit} />
      )}
    </div>
  )
}
