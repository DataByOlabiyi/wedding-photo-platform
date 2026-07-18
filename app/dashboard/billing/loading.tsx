import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BillingLoading() {
  return (
    <div className="max-w-2xl space-y-8" role="status" aria-live="polite" aria-label="Loading billing">
      <div className="animate-pulse space-y-1.5">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>

      <Card className="animate-pulse">
        <CardHeader><div className="h-4 w-24 rounded bg-muted" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-12 rounded bg-muted" />
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="mt-1 h-3 w-16 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-muted" />
                  <div className="h-3 w-40 rounded bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
              <div className="h-9 w-full rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
