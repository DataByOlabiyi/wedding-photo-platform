"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Camera, Heart } from "lucide-react"
import { useGuestIdentity } from "@/hooks/use-guest-identity"
import { Header } from "@/components/header"
import { FolderGrid } from "@/components/folder-grid"
import { GuestNameModal } from "@/components/guest-name-modal"

export default function HomePage() {
  const { guestName, setGuestName, clearGuestName, isLoading, hasIdentity } = useGuestIdentity()
  const [showNameModal, setShowNameModal] = useState(false)

  useEffect(() => {
    if (!isLoading && !hasIdentity) {
      setShowNameModal(true)
    }
  }, [isLoading, hasIdentity])

  const handleNameSubmit = (name: string) => {
    setGuestName(name)
    setShowNameModal(false)
  }

  const handleChangeName = () => {
    clearGuestName()
    setShowNameModal(true)
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
      <Header guestName={guestName} onChangeName={handleChangeName} />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-card py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            {/* Decorative Heart */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            
            {/* Title */}
            <h1 className="font-serif text-4xl font-semibold tracking-wide text-foreground md:text-5xl lg:text-6xl text-balance">
              Our Wedding Memories
            </h1>
            
            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground md:text-xl text-pretty">
              Browse through the beautiful moments captured by our guests.
              Each folder contains photos shared by a loved one.
            </p>
            
            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Photos from all our guests</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 bottom-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </section>

        {/* Gallery Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                Guest Albums
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click on an album to view all photos
              </p>
            </div>
          </div>
          
          <FolderGrid />
        </section>
      </main>

      {/* Floating Add Button */}
      {hasIdentity && (
        <Link
          href="/upload"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:bottom-8 md:right-8 md:h-16 md:w-16"
          aria-label="Upload photos"
        >
          <Plus className="h-7 w-7 md:h-8 md:w-8" />
        </Link>
      )}

      {showNameModal && (
        <GuestNameModal onSubmit={handleNameSubmit} />
      )}
    </div>
  )
}
