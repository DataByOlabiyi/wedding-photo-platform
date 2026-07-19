import Link from "next/link"
import { SiteHeader } from "@/components/site-header"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-mono text-data text-muted-foreground">404</p>
          <h1 className="mt-3 font-serif text-heading">This page went missing.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The link may be wrong, or the page may have moved on without us.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 hover:text-muted-foreground"
          >
            Go to the homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
