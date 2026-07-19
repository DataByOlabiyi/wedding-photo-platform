import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/reveal"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { PLAN_LIMITS } from "@/lib/plan-limits"
import { Check, ChevronDown } from "lucide-react"

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Create your event.",
    copy: "Give it a name, pick a date, and you're done. SnapEvent hands you a private link for your gallery — ready before the invitations are.",
    indent: false,
  },
  {
    n: "02",
    title: "Put the link on the tables.",
    copy: "Print the link — or a QR code — on your tables. Tuck it into the menu, prop it against the centrepiece, tape it by the bar. Anywhere a phone comes out, the gallery is one tap away.",
    indent: true,
  },
  {
    n: "03",
    title: "Guests upload from their phones.",
    copy: "No app to download, no account to make. They open the link, add their name, and send their photos straight in — between the toasts, on the dance floor, from the taxi home.",
    indent: false,
  },
  {
    n: "04",
    title: "Wake up to one gallery.",
    copy: "The morning after, it's all there in one place: every angle, every table, every moment you were too busy dancing to see. Yours to keep, moderate, and download.",
    indent: true,
  },
]

const SHOWCASE_TILES = [
  "bg-muted",
  "bg-secondary/70",
  "bg-muted/70",
  "bg-accent/60",
  "bg-muted",
  "bg-secondary/50",
  "bg-muted/80",
  "bg-muted",
  "bg-accent/40",
]

const FAQS = [
  {
    q: "Do guests need an app or an account?",
    a: "No. Guests open your link in their phone's browser, type their name, and upload. There is nothing to install and nothing to sign up for.",
  },
  {
    q: "How many photos can guests upload?",
    a: "Up to 50 photos per batch, at up to 50 MB each. Guests can come back and upload more batches whenever they like while the event is open.",
  },
  {
    q: "Can a guest remove a photo they uploaded?",
    a: "Yes — guests can delete their own photos within 24 hours of uploading, straight from their photo page. After that, the event host can remove any photo at any time.",
  },
  {
    q: "Who can see the gallery?",
    a: "Only people you share the gallery link with — and only if you've turned gallery viewing on. You control visibility and can moderate any photo before it appears.",
  },
  {
    q: "Can I close uploads after the event?",
    a: "Yes. You can close the upload window from your dashboard whenever you're done collecting photos. The gallery stays yours to view and download.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
            Private galleries for weddings
          </p>
          <h1 className="mt-4 font-serif text-display font-display-wonk text-balance">
            Every phone at the wedding, <span className="italic">one gallery</span> in the morning.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body text-muted-foreground">
            Create a private gallery and share one link. Guests upload straight from their phones — no app, no account, nothing to install. You keep every photo your photographer didn&rsquo;t take.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full px-8 sm:w-auto">Create your event</Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="link" size="lg" className="w-full sm:w-auto">See how it works</Button>
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-reveal px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
            How it works
          </p>
          <h2 className="mt-3 max-w-md font-serif text-heading">From &ldquo;save the date&rdquo; to every last photo.</h2>
          <ol className="mt-12 space-y-12 sm:space-y-16">
            {HOW_IT_WORKS.map(({ n, title, copy, indent }) => (
              <li key={n} className={`grid gap-3 sm:grid-cols-[88px_1fr] sm:gap-8 ${indent ? "sm:ml-16 lg:ml-24" : ""}`}>
                <div className="flex items-start sm:justify-end">
                  <span className="border-l-2 border-border pl-3 font-mono text-data text-muted-foreground sm:border-l-0 sm:border-r-2 sm:pl-0 sm:pr-3">{n}</span>
                </div>
                <div className="max-w-lg">
                  <h3 className="font-serif text-subheading">{title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="scroll-reveal overflow-hidden border-y border-border/60 bg-muted/50 py-16 sm:py-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
          <div>
            <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
              The gallery
            </p>
            <h2 className="mt-3 font-serif text-heading">One page, everyone&rsquo;s pictures.</h2>
            <p className="mt-4 text-body text-muted-foreground">
              Photos arrive grouped by guest, counted as they come in, and private until you say otherwise.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-lg" aria-hidden="true">
            <div className="absolute -left-4 top-8 hidden w-52 -rotate-3 rounded-xl border border-border/70 bg-card p-2 shadow-card sm:block">
              <div className="aspect-[4/3] rounded-sm bg-secondary/60" />
              <div className="space-y-1.5 p-2">
                <div className="h-2.5 w-24 rounded-full bg-muted" />
                <p className="font-mono text-[0.6875rem] text-muted-foreground">18 photos</p>
              </div>
            </div>
            <div className="relative ml-auto w-full max-w-sm rotate-0 rounded-xl border border-border/70 bg-card p-4 shadow-card sm:max-w-md sm:rotate-1">
              <div className="flex items-baseline justify-between gap-4 pb-3">
                <span className="font-serif text-subheading">Amara &amp; Tobi</span>
                <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted-foreground">142 photos · 23 guests</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SHOWCASE_TILES.map((tone, i) => (
                  <div key={i} className={`aspect-square rounded-sm ${tone}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-reveal px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl">
          <p className="text-center text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
            Pricing
          </p>
          <h2 className="mt-3 text-center font-serif text-heading">Start free. Stay for every event.</h2>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
            <Reveal>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>
                    <span className="font-serif text-heading text-foreground">Free</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    <li className="flex items-center gap-2.5 text-sm">
                      <Check className="size-4 shrink-0 text-muted-foreground" />
                      <span><span className="font-mono">{PLAN_LIMITS.starter.maxEvents}</span> event</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <Check className="size-4 shrink-0 text-muted-foreground" />
                      <span><span className="font-mono">{PLAN_LIMITS.starter.maxPhotosPerEvent}</span> photos per event</span>
                    </li>
                  </ul>
                  <Link href="/auth/signup" className="block">
                    <Button variant="outline" className="h-11 w-full">Create your event</Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={60}>
              <Card className="relative h-full border-foreground/25">
                {process.env.NEXT_PUBLIC_BETA_FREE_PRO === "true" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Free during beta</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>
                    <span className="font-mono text-2xl font-medium text-foreground">₦19,000</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {["Everything in Starter", "Unlimited events", "Unlimited photos"].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="size-4 shrink-0 text-muted-foreground" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signup" className="block">
                    <Button className="h-11 w-full">Get started</Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          </div>
          <p className="mt-6 text-center text-caption text-muted-foreground">
            Every plan includes bulk ZIP download, PIN protection, and moderation tools.
          </p>
        </div>
      </section>

      <section className="scroll-reveal px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-3xl">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">
            Questions
          </p>
          <h2 className="mt-3 font-serif text-heading">Before you ask.</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-body font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
