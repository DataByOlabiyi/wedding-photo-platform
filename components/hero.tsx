"use client"

import { Heart } from "lucide-react"

interface HeroProps {
  totalPhotos: number
  totalGuests: number
}

export function Hero({ totalPhotos, totalGuests }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pb-8 pt-12 sm:pb-12 sm:pt-16">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <div className="container relative mx-auto px-4 text-center">
        {/* Heart ornament */}
        <div className="mb-6 inline-flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <Heart className="h-5 w-5 fill-primary/20 text-primary" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </div>
        
        <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl">
          <span className="block text-balance">Our Wedding</span>
          <span className="block text-balance mt-1 text-primary">Memories</span>
        </h1>
        
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:mt-6 sm:text-lg">
          A collection of beautiful moments captured by our beloved guests
        </p>
        
        {/* Stats */}
        <div className="mt-8 flex items-center justify-center gap-8 sm:gap-12">
          <div className="text-center">
            <div className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {totalPhotos}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Photos
            </div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {totalGuests}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Contributors
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
