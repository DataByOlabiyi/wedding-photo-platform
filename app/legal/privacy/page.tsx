import Link from 'next/link'
import { Camera } from 'lucide-react'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">SnapEvent</span>
          </Link>
        </div>
      </header>
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-serif text-4xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: June 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">1. What We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect the following information when you use the Service:
            </p>
            <ul className="mt-3 space-y-1 list-disc pl-5 text-muted-foreground leading-relaxed">
              <li>Account email address and hashed password (for registered couples).</li>
              <li>Photos uploaded by guests, along with any display name provided at upload time.</li>
              <li>Usage logs, including page requests and upload events, to diagnose issues.</li>
              <li>IP addresses, used solely for rate limiting and abuse prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">2. How We Use It</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to operate and improve the Service; to send
              transactional emails such as account confirmation and password resets; to enforce
              rate limits and prevent abuse; and to respond to support requests. We do not sell,
              rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">3. Storage and Processors</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored and processed by the following third-party sub-processors:
            </p>
            <ul className="mt-3 space-y-1 list-disc pl-5 text-muted-foreground leading-relaxed">
              <li>
                <strong>Supabase</strong> — PostgreSQL database and object storage (photos).
                Data is hosted on servers in the EU/US depending on your region.
              </li>
              <li>
                <strong>Stripe</strong> — Payment processing. We do not store card details;
                they go directly to Stripe.
              </li>
              <li>
                <strong>Resend</strong> — Transactional email delivery (account emails only).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">4. Guest Photos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Photos uploaded by guests are stored on behalf of the event organiser (Couple).
              The Couple is the data controller for their event&apos;s photos; we act as a
              data processor. Guests may self-delete their photos within 24 hours of upload
              using the link shown on the upload confirmation page. After that window, deletion
              requests should be directed to the event organiser or, if the organiser is
              unresponsive, to us at{' '}
              <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">
                usework.it@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">5. EXIF Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Photos are automatically stripped of EXIF metadata — including GPS location,
              device model, and timestamp — before being stored. We do not retain or expose
              EXIF data to anyone.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Event data and photos are retained until the account holder deletes the event or
              deletes their account. Deleting an account permanently removes all associated
              organisations, events, and uploaded media. We may retain anonymised usage
              statistics (no personal identifiers) indefinitely for product analytics.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may request access to, correction of, or deletion of your personal data at
              any time by contacting us at{' '}
              <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">
                usework.it@gmail.com
              </a>
              . EU residents have the right to erasure under GDPR Article 17 and may also
              lodge a complaint with their national supervisory authority. We will respond to
              verified requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential session cookies only — set by Supabase Auth to maintain your
              login session. We do not use advertising cookies, third-party tracking pixels,
              or analytics cookies that send data to external services.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">9. Children</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Service is not directed at children under the age of 13, and we do not
              knowingly collect personal data from children. Photos of minors may appear in
              event galleries (e.g. family wedding photos) — if you believe a photo of a child
              has been uploaded without parental consent, please contact us so we can assist
              with removal.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Privacy questions or data requests:{' '}
              <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">
                usework.it@gmail.com
              </a>
              . You can also read our{' '}
              <Link href="/legal/terms" className="underline underline-offset-4">
                Terms of Service
              </Link>{' '}
              or visit the{' '}
              <Link href="/support" className="underline underline-offset-4">
                support page
              </Link>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
