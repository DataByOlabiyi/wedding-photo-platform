import { Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCardsSkeleton, TableRowSkeleton } from "@/components/skeletons"

export default function SuperadminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Shield className="h-5 w-5 text-destructive" />
          <h1 className="font-serif text-lg font-semibold">Platform Admin</h1>
          <Badge variant="destructive" className="text-xs">Superadmin</Badge>
        </div>
      </header>

      <main
        className="container mx-auto max-w-5xl px-4 py-8 space-y-8"
        role="status"
        aria-live="polite"
        aria-label="Loading admin dashboard"
      >
        <StatCardsSkeleton />
        <Card>
          <CardHeader><CardTitle className="text-base">Organizations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-6">
                  <TableRowSkeleton columns={3} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
