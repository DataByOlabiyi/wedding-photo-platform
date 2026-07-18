import { EventHeaderSkeleton, GalleryGridSkeleton } from "@/components/skeletons"

export default function EventGalleryLoading() {
  return (
    <div
      className="container mx-auto max-w-6xl px-4 py-8"
      role="status"
      aria-live="polite"
      aria-label="Loading event"
    >
      <EventHeaderSkeleton />
      <GalleryGridSkeleton count={10} />
    </div>
  )
}
