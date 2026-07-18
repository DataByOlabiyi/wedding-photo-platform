import Link from 'next/link'
import { Camera } from 'lucide-react'

const PRODUCT_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/auth/login', label: 'Log in' },
  { href: '/auth/signup', label: 'Create your event' },
]

const SUPPORT_LINKS = [
  { href: '/support', label: 'Contact support' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Camera className="size-4 text-muted-foreground" />
              <span className="font-serif text-xl tracking-tight">SnapEvent</span>
            </Link>
            <p className="mt-3 text-caption text-muted-foreground sm:max-w-xs">
              Private photo galleries for weddings — and every day that feels like one.
            </p>
          </div>
          <nav aria-label="Footer" className="contents">
            <div>
              <h3 className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
                Product
              </h3>
              <ul className="mt-4 space-y-1.5">
                {PRODUCT_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-block py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
                Support
              </h3>
              <ul className="mt-4 space-y-1.5">
                {SUPPORT_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-block py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">© 2026 SnapEvent</p>
          <p className="font-serif text-sm italic text-muted-foreground">
            For the pictures the photographer misses.
          </p>
        </div>
      </div>
    </footer>
  )
}
