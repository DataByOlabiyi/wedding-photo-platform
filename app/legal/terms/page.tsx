import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Legal</p>
        <h1 className="mt-3 mb-2 font-serif text-heading">Terms of Service</h1>
        <p className="mb-12 font-mono text-data text-muted-foreground">Last updated: June 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="font-serif text-subheading mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account, uploading photos, or otherwise accessing SnapEvent
              (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do
              not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              SnapEvent is a photo-sharing platform designed for weddings and private events.
              Couples (account holders) create events and share an upload link with guests.
              Guests may upload photos to the event gallery without creating an account.
              The couple can view, moderate, and download all uploaded photos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">3. Account Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for keeping your login credentials confidential. All activity
              that occurs under your account is your responsibility. You must notify us
              immediately at <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">usework.it@gmail.com</a> if
              you suspect unauthorised access to your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to upload, share, or transmit content that: (a) is illegal or
              violates any applicable law; (b) infringes the intellectual property or privacy
              rights of any third party; (c) constitutes harassment, hate speech, or threats;
              or (d) contains malware, spam, or deceptive material. We reserve the right to
              remove content that violates these terms and to suspend or terminate accounts
              responsible for such content, without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">5. Guest Uploads</h2>
            <p className="text-muted-foreground leading-relaxed">
              By uploading a photo to an event, a guest grants the event organiser (Couple) a
              non-exclusive, royalty-free licence to view and download that photo for personal
              use related to the event. We do not claim ownership of guest-uploaded content.
              Guests may self-delete their photos within 24 hours of upload via the upload page.
              After that window, deletion requests should be directed to the event organiser or
              to us at <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">usework.it@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">6. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our collection and use of personal data is described in our{' '}
              <Link href="/legal/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              , which forms part of these Terms of Service. By using the Service you consent
              to the data practices described there.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or permanently terminate your account if you violate these terms
              or if we are required to do so by law. You may delete your account at any time
              via the account settings page in your dashboard. On deletion, all associated
              events and media are permanently removed.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. SnapEvent
              shall not be liable for any indirect, incidental, or consequential damages arising
              from your use of the Service, including but not limited to loss of photos or data
              beyond our documented backup obligations. Our total liability to you shall not
              exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-subheading mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms? Email us at{' '}
              <a href="mailto:usework.it@gmail.com" className="underline underline-offset-4">
                usework.it@gmail.com
              </a>
              . You can also visit our{' '}
              <Link href="/support" className="underline underline-offset-4">
                support page
              </Link>{' '}
              for common help topics.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
