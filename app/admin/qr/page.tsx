'use client'

import { useState, useEffect } from 'react'
import { Download, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import QRCode from 'qrcode'
import Image from 'next/image'

export default function AdminQRPage() {
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const galleryUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/` 
    : 'https://bm-wedding-photo.vercel.app/'

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Generate QR code as data URL directly (no canvas ref needed)
      const dataUrl = await QRCode.toDataURL(galleryUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      
      setQrCode(dataUrl)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] QR generation error:', errorMessage)
      setError(`Failed to generate QR code: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a')
      link.href = qrCode
      link.download = 'wedding-gallery-qr.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-xl font-semibold ml-4">Upload QR Code</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl">Share with Your Guests</h2>
            <p className="text-muted-foreground">
              Guests can scan this QR code to view and contribute to the wedding photo gallery
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
              <p className="font-semibold">Error generating QR code</p>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                onClick={generateQRCode} 
                variant="outline" 
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !error && qrCode && (
            <div className="space-y-8">
              {/* QR Code Display */}
              <div className="flex justify-center bg-white p-8 rounded-lg border shadow-lg">
                <div className="w-full max-w-sm flex items-center justify-center">
                  <img
                    src={qrCode}
                    alt="Wedding Photo Upload QR Code"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Gallery URL</p>
                <p className="text-sm text-muted-foreground break-all font-mono">
                  {galleryUrl}
                </p>
              </div>

              {/* Download Button */}
              <Button 
                onClick={handleDownload} 
                size="lg" 
                className="w-full gap-2"
              >
                <Download className="h-5 w-5" />
                Download QR Code
              </Button>

              {/* Instructions */}
              <div className="bg-accent/10 border border-accent p-6 rounded-lg space-y-4">
                <h3 className="font-semibold">How to use:</h3>
                <ul className="space-y-2 text-sm list-disc list-inside">
                  <li>Download the QR code above</li>
                  <li>Print it and display at the wedding reception</li>
                  <li>Share the URL digitally or via text message</li>
                  <li>Guests scan to view the photo gallery and upload their photos</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
