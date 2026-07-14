import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EventsGridSkeleton } from "@/components/skeletons"

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-label="Loading events">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2 rounded-full">
            <PlusCircle className="h-4 w-4" />
            New event
          </Button>
        </Link>
      </div>
      <EventsGridSkeleton />
    </div>
  )
}
