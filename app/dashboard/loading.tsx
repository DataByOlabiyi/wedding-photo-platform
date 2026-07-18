import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EventsGridSkeleton } from "@/components/skeletons"

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-label="Loading events">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New event
          </Button>
        </Link>
      </div>
      <EventsGridSkeleton />
    </div>
  )
}
