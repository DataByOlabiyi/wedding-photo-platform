"use client"

import { useState, useEffect } from "react"
import { useGuestIdentity } from "@/hooks/use-guest-identity"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { MediaGrid } from "@/components/media-grid"
import { UploadButton } from "@/components/upload-button"
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header guestName={guestName} onChangeName={handleChangeName} />
      
      <main>
        <Hero />
        
        <section className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Wedding Gallery
            </h2>
            {hasIdentity && <UploadButton guestName={guestName!} />}
          </div>
          
          <MediaGrid />
        </section>
      </main>

      {showNameModal && (
        <GuestNameModal onSubmit={handleNameSubmit} />
      )}
    </div>
  )
}
