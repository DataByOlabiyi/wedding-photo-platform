import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { MediaProvider } from '@/lib/media-context'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: 'BM Wedding - Photo Gallery | Share Wedding Memories',
  description: 'Share and view beautiful wedding photos from BM Wedding. Upload your favorite moments and contribute to our wedding photo gallery.',
  keywords: 'wedding photos, photo gallery, wedding memories, photo sharing',
  manifest: '/manifest.json',
  metadataBase: new URL('https://bm-wedding-photo.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BM Wedding Photo',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bm-wedding-photo.vercel.app',
    title: 'BM Wedding - Photo Gallery',
    description: 'Share and view beautiful wedding photos from BM Wedding',
    siteName: 'BM Wedding Photo Gallery',
    images: [
      {
        url: 'https://bm-wedding-photo.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BM Wedding Photo Gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BM Wedding - Photo Gallery',
    description: 'Share and view beautiful wedding photos from BM Wedding',
    images: ['https://bm-wedding-photo.vercel.app/og-image.jpg'],
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
  themeColor: '#2d9d78',
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
    <html lang="en" className={`${cormorant.variable} ${inter.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MediaProvider>
            {children}
          </MediaProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
