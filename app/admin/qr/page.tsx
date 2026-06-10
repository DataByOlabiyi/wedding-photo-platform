'use client'

import { useState, useEffect } from 'react'
import { Download, ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import QRCode from 'qrcode'
import { siteConfig } from '@/lib/site-config'

export default function AdminQRPage() {
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : siteConfig.url + '/'

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      const dataUrl = await QRCode.toDataURL(galleryUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 600,
        color: { dark: '#1c1810', light: '#ffffff' },
      })
      setQrCode(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return
    const link = document.createElement('a')
    link.href = qrCode
    link.download = 'wedding-gallery-qr.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => window.print()

  return (
    <>
      {/* ── Screen UI ──────────────────────────────────────────── */}
      <div className="no-print min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4 gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">QR Code & Print Tickets</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl space-y-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
              <p className="font-semibold">Error generating QR code</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={generateQRCode} variant="outline" size="sm" className="mt-4">Retry</Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !error && qrCode && (
            <>
              {/* QR preview */}
              <div className="flex justify-center bg-white p-8 rounded-2xl border shadow-sm">
                <img src={qrCode} alt="Wedding Gallery QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-1">
                <p className="text-sm font-semibold">Gallery URL</p>
                <p className="text-sm text-muted-foreground break-all font-mono">{galleryUrl}</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download QR
                </Button>
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print 4 Tickets
                </Button>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Print instructions</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click <strong>Print 4 Tickets</strong> — prints one A4 sheet with 4 tickets</li>
                  <li>Cut along the dashed lines</li>
                  <li>Place one ticket per guest table</li>
                  <li>Guests scan the QR code to share their photos</li>
                </ul>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Print Layout ───────────────────────────────────────── */}
      {qrCode && (
        <div className="print-only tickets-page">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="ticket">
              {/* Main body */}
              <div className="ticket-body">
                {/* Top ornament */}
                <div className="ticket-ornament">
                  <span className="ornament-line" />
                  <span className="ornament-heart">♥</span>
                  <span className="ornament-line" />
                </div>

                <div className="ticket-couple">{siteConfig.coupleNames}</div>
                <div className="ticket-subtitle">Wedding Memories</div>

                <div className="ticket-fields">
                  <div className="ticket-field">
                    <span className="field-label">DATE</span>
                    <span className="field-value">{siteConfig.weddingDate}</span>
                  </div>
                  <div className="ticket-field">
                    <span className="field-label">OCCASION</span>
                    <span className="field-value">Wedding Celebration</span>
                  </div>
                </div>

                <div className="ticket-divider" />

                <p className="ticket-message">
                  You captured a moment we'll cherish forever.<br />
                  Scan to share your photos from today's celebration.
                </p>

                <div className="ticket-url">{galleryUrl}</div>
              </div>

              {/* Perforation */}
              <div className="ticket-perf">
                <span className="scissors">✂</span>
              </div>

              {/* Stub */}
              <div className="ticket-stub">
                <div className="stub-label-top">SCAN &amp;</div>
                <div className="stub-label-top">SHARE</div>
                <div className="stub-qr">
                  <img src={qrCode} alt="QR Code" />
                </div>
                <div className="stub-footer">✦ MEMORY ✦</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        /* ── Hide print layout on screen ── */
        .print-only { display: none; }

        @media print {
          /* Hide everything except the tickets */
          .no-print { display: none !important; }
          .print-only { display: block; }

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body { margin: 0; background: white; }

          /* 2×2 grid on one A4 page */
          .tickets-page {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 6mm;
            width: 100%;
            height: 100vh;
            box-sizing: border-box;
          }

          /* Each ticket */
          .ticket {
            display: flex;
            flex-direction: row;
            border: 1.5px solid #c9a86c;
            border-radius: 6px;
            overflow: hidden;
            background: #faf8f5;
            font-family: 'Cormorant Garamond', 'Georgia', serif;
            box-sizing: border-box;
            position: relative;
          }

          /* Cut marks at corners */
          .ticket::before,
          .ticket::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
          }

          /* Main body — left 68% */
          .ticket-body {
            flex: 0 0 68%;
            padding: 5mm 5mm 4mm 5mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #faf8f5;
            min-width: 0;
          }

          .ticket-ornament {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 2mm;
          }
          .ornament-line {
            flex: 1;
            height: 0.5px;
            background: #c9a86c;
          }
          .ornament-heart {
            color: #c9a86c;
            font-size: 8pt;
          }

          .ticket-couple {
            font-size: 15pt;
            font-weight: 600;
            color: #1c1810;
            letter-spacing: 0.02em;
            line-height: 1.1;
          }

          .ticket-subtitle {
            font-size: 8pt;
            color: #8a6a3a;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-top: 1mm;
            font-weight: 400;
          }

          .ticket-fields {
            display: flex;
            gap: 6mm;
            margin-top: 3mm;
          }
          .ticket-field {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .field-label {
            font-size: 5.5pt;
            letter-spacing: 0.18em;
            color: #8a6a3a;
            font-weight: 500;
          }
          .field-value {
            font-size: 8pt;
            color: #1c1810;
            font-weight: 600;
          }

          .ticket-divider {
            height: 0.5px;
            background: #e8d9c0;
            margin: 2mm 0;
          }

          .ticket-message {
            font-size: 7.5pt;
            color: #3d2e1a;
            line-height: 1.5;
            font-style: italic;
            margin: 0;
          }

          .ticket-url {
            font-size: 5.5pt;
            color: #8a6a3a;
            font-family: 'Courier New', monospace;
            margin-top: 2mm;
            letter-spacing: 0.05em;
          }

          /* Perforation — dashed vertical line */
          .ticket-perf {
            flex: 0 0 auto;
            width: 6mm;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .ticket-perf::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 0;
            border-left: 1.5px dashed #c9a86c;
          }
          .scissors {
            font-size: 9pt;
            color: #c9a86c;
            background: #faf8f5;
            padding: 1mm 0;
            position: relative;
            z-index: 1;
            transform: rotate(90deg);
            display: inline-block;
          }

          /* Stub — right 26% */
          .ticket-stub {
            flex: 1;
            background: #f5ede0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3mm 3mm;
            gap: 2mm;
          }

          .stub-label-top {
            font-size: 7pt;
            letter-spacing: 0.2em;
            font-weight: 700;
            color: #8a6a3a;
            line-height: 1.2;
          }

          .stub-qr img {
            width: 100%;
            max-width: 28mm;
            height: auto;
            display: block;
          }
          .stub-qr {
            width: 28mm;
          }

          .stub-footer {
            font-size: 6pt;
            letter-spacing: 0.2em;
            color: #c9a86c;
            margin-top: 1mm;
          }
        }
      `}</style>
    </>
  )
}
