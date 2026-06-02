import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-8">
        <div>
          <h1 className="font-serif text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="w-full">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Go to Gallery
            </Button>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>If you think this is a mistake, please contact us.</p>
        </div>
      </div>
    </div>
  )
}
