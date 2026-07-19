import { requireOrg, getPlatformAdminRole } from '@/lib/auth'
import Link from 'next/link'
import { Heart, LayoutDashboard, LogOut, PlusCircle, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, membership } = await requireOrg()
  const staffRole = await getPlatformAdminRole(user.id)
  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations as { name: string; plan: string } | null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
              <span className="text-sm font-semibold tracking-[0.01em]">{org?.name ?? 'Dashboard'}</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  Events
                </Button>
              </Link>
              <Link href="/dashboard/events/new">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  New event
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {org?.plan === 'starter' && (
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            {staffRole && (
              <>
                <Link href="/superadmin">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Platform admin
                  </Button>
                </Link>
                <Link href="/superadmin">
                  <Button variant="ghost" size="icon-sm" className="sm:hidden text-muted-foreground" title="Platform admin" aria-label="Platform admin">
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
            <form action="/api/admin/logout" method="POST">
              <Button variant="ghost" size="icon-sm" type="submit" title="Sign out" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
