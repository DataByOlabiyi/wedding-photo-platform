import type { Metadata, Viewport } from 'next'
import { Fraunces, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { MediaProvider } from '@/lib/media-context'
import { Toaster } from 'sonner'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'WONK'],
  display: 'swap',
  variable: '--font-serif',
})

const switzer = localFont({
  src: './fonts/Switzer-Variable.woff2',
  weight: '300 700',
  display: 'swap',
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "SnapEvent — Wedding Photo Sharing",
  description: "Create a private photo gallery for your event. Share a link. Guests upload directly from their phones.",
  keywords: 'wedding photos, photo gallery, wedding memories, photo sharing',
  manifest: '/manifest.json',
  metadataBase: new URL(siteConfig.url),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "SnapEvent",
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: "SnapEvent",
    description: "Create a private photo gallery for your event. Share a link. Guests upload directly from their phones.",
    siteName: "SnapEvent",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "SnapEvent",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "SnapEvent",
    description: "Create a private photo gallery for your event. Share a link. Guests upload directly from their phones.",
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#f7f2ea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${switzer.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <MediaProvider>
            {children}
          </MediaProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
