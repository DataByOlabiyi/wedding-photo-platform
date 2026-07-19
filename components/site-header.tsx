import Link from 'next/link'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SiteHeader({ showActions = true }: { showActions?: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Camera className="size-4 text-muted-foreground" />
          <span className="font-serif text-xl tracking-tight">SnapEvent</span>
        </Link>
        {showActions && (
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
