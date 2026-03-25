"use client"

import { Heart } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl font-semibold tracking-wide text-foreground md:text-5xl lg:text-6xl text-balance">
          Share Your Moments
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl text-pretty">
          Capture and share the beautiful memories from our wedding celebration. 
          Upload your photos and videos to help us relive this special day.
        </p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -left-4 top-1/4 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-4 bottom-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
    </section>
  )
}
