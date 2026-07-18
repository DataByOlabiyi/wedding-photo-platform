import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function GalleryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-sm bg-muted animate-pulse"
        />
      ))}
    </div>
  )
}

export function EventsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-5 w-14 shrink-0 rounded-md bg-muted" />
            </div>
            <div className="mt-2 h-3.5 w-24 rounded bg-muted" />
            <div className="mt-1.5 h-3 w-28 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-12 rounded bg-muted" />
              <div className="h-3.5 w-6 rounded bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-3 w-32 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function EventHeaderSkeleton() {
  return (
    <div className="mb-8 flex animate-pulse flex-col items-start justify-between gap-4 sm:flex-row">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-9 w-56 rounded bg-muted" />
          <div className="h-5 w-14 rounded-md bg-muted" />
        </div>
        <div className="h-4 w-20 rounded bg-muted pl-9" />
      </div>
      <div className="flex items-center gap-2 pl-9 sm:pl-0">
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="h-8 w-24 rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-5">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="h-7 w-12 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 py-4 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded flex-1" />
      ))}
    </div>
  )
}
