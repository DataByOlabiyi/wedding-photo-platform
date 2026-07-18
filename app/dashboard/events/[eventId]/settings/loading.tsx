import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EventSettingsLoading() {
  return (
    <div className="max-w-lg space-y-6" role="status" aria-live="polite" aria-label="Loading settings">
      <div className="animate-pulse space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-44 rounded bg-muted" />
      </div>

      <Card className="animate-pulse">
        <CardHeader><div className="h-4 w-24 rounded bg-muted" /></CardHeader>
        <CardContent className="space-y-3">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-muted" />
            <div className="h-8 w-16 rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-1 h-3 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="mt-1 h-3 w-40 rounded bg-muted" />
            </div>
            <div className="h-[1.15rem] w-8 rounded-full bg-muted" />
          </div>
          <div>
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="mt-1.5 h-9 w-full rounded-lg bg-muted" />
            <div className="mt-1 h-3 w-56 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-pulse">
        <CardHeader><div className="h-4 w-36 rounded bg-muted" /></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="mt-1 h-3 w-52 rounded bg-muted" />
            </div>
            <div className="h-[1.15rem] w-8 rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="mt-1 h-3 w-56 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-9 w-full rounded-lg bg-muted" />
        </CardContent>
      </Card>

      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
          <div className="mt-1 h-3 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 rounded-lg bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}
