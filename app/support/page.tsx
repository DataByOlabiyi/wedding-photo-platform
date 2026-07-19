import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: 'Support' }

const faqs = [
  {
    question: "Guests can't upload photos",
    answer:
      'Check that the event is active (not archived or closed) in your dashboard settings. Also confirm guests are visiting the correct upload link — it should match the event slug shown in your dashboard.',
  },
  {
    question: 'The gallery is not loading or showing photos',
    answer:
      'Make sure the gallery link is correct and that "Allow guests to view gallery" is enabled in your event settings. If photos were recently uploaded they may still be in the moderation queue.',
  },
  {
    question: 'I forgot my password',
    answer: null, // handled specially with a link
  },
  {
    question: 'How do I delete a photo I uploaded as a guest?',
    answer:
      'Guests can delete their own photos within 24 hours of upload using the link shown on the upload confirmation page. After 24 hours, please contact the event organiser or email us at usework.it@gmail.com.',
  },
  {
    question: 'How do I cancel or change my plan?',
    answer:
      'Visit the Billing section of your dashboard. You can upgrade, downgrade, or cancel your subscription there at any time.',
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-16 space-y-10">

        <div className="space-y-3 text-center">
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Support</p>
          <h1 className="font-serif text-heading">Get help</h1>
          <p className="text-muted-foreground">
            We&rsquo;re here to help with uploads, galleries, and billing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              For issues not covered below, email us and we&apos;ll get back to you within 24 hours.
            </p>
            <Button asChild className="h-11 gap-2">
              <a href="mailto:usework.it@gmail.com">
                <Mail className="h-4 w-4" />
                Contact support
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-serif text-subheading">Common questions</h2>

          <dl className="space-y-4">
            {faqs.map((faq) =>
              faq.question === 'I forgot my password' ? (
                <Card key={faq.question}>
                  <CardContent className="pt-5 pb-5 space-y-1">
                    <dt className="text-sm font-medium">{faq.question}</dt>
                    <dd className="text-sm text-muted-foreground leading-relaxed">
                      Use the{' '}
                      <Link
                        href="/auth/forgot-password"
                        className="underline underline-offset-4"
                      >
                        forgot password page
                      </Link>{' '}
                      to receive a reset link by email. If you don&apos;t receive it within a
                      few minutes, check your spam folder.
                    </dd>
                  </CardContent>
                </Card>
              ) : (
                <Card key={faq.question}>
                  <CardContent className="pt-5 pb-5 space-y-1">
                    <dt className="text-sm font-medium">{faq.question}</dt>
                    <dd className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </dd>
                  </CardContent>
                </Card>
              )
            )}
          </dl>
        </div>

        <div className="flex justify-center gap-6 text-xs text-muted-foreground pt-2">
          <Link href="/legal/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Back to dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
