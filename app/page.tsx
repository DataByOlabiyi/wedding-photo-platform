import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">SnapEvent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="rounded-full">Get started free</Button></Link>
          </div>
        </div>
      </header>

      <section className="py-24 sm:py-32 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground mb-6 tracking-wide">
            Wedding photo sharing, made simple
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight">
            Every guest, every shot,<br className="hidden sm:block" />
            <span className="text-primary"> one place.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create a private gallery for your event. Share a link. Guests upload directly from their phones — no app needed.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8">Get started free</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8">Log in</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-semibold text-center text-foreground mb-4">How it works</h2>
          <p className="text-center text-muted-foreground mb-12">Set up your event gallery in minutes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: "1", title: "Create your event", desc: "Sign up, name your event, and get a shareable link in under a minute." },
              { n: "2", title: "Share with guests", desc: "Send the link by text, email, or print the QR code on your table." },
              { n: "3", title: "Guests upload photos", desc: "Guests open the link on any phone and upload directly — no account needed." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg shrink-0">{n}</div>
                <h3 className="font-semibold text-foreground text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-semibold text-center text-foreground mb-4">Simple pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Starter</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">Free</span>{" "}
                  <span className="text-muted-foreground text-sm">forever</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {["1 event", "200 photos per event", "Individual photo download"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button variant="outline" className="w-full rounded-full">Get started free</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Badge className="px-3">Most popular</Badge>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Pro
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$19</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {["Unlimited events", "Unlimited photos", "Bulk ZIP download", "Event PIN protection", "Guest email collection"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full rounded-full">Get started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 px-4 mt-auto">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 SnapEvent</p>
          <nav className="flex items-center gap-4">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
