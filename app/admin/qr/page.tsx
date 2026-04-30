'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function AdminQRPage() {
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const uploadUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/upload` 
    : 'https://bm-wedding-photo.vercel.app/upload'

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, uploadUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.95,
          margin: 1,
          width: 500,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        })
        
        // Also generate data URL for preview
        const dataUrl = canvasRef.current.toDataURL('image/png')
        setQrCode(dataUrl)
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.href = canvasRef.current.toDataURL('image/png')
      link.download = 'wedding-upload-qr.png'
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
              Guests can scan this QR code to upload their wedding photos
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* QR Code Display */}
              <div className="flex justify-center bg-white p-8 rounded-lg border">
                <canvas
                  ref={canvasRef}
                  className="h-auto w-80"
                  style={{ display: 'block' }}
                />
              </div>

              {/* URL Display */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Upload URL</p>
                <p className="text-sm text-muted-foreground break-all font-mono">
                  {uploadUrl}
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
                  <li>Guests scan to start uploading their photos</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
