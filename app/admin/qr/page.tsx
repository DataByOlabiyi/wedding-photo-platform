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

  useEffect(() => { generateQRCode() }, [])

  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      const dataUrl = await QRCode.toDataURL(galleryUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
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
    const a = document.createElement('a')
    a.href = qrCode
    a.download = 'wedding-gallery-qr.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <>
      {/* ── Screen UI ── */}
      <div className="no-print min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4 gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
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
              <div className="flex justify-center bg-white p-8 rounded-2xl border shadow-sm">
                <img src={qrCode} alt="Wedding Gallery QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1">Gallery URL</p>
                <p className="text-sm text-muted-foreground break-all font-mono">{galleryUrl}</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />Download QR
                </Button>
                <Button onClick={() => window.print()} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />Print 6 Tickets
                </Button>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Print instructions</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click <strong>Print 6 Tickets</strong> — prints one A4 sheet with 6 tickets (2 columns × 3 rows)</li>
                  <li>Cut along the dashed lines between tickets</li>
                  <li>One ticket per guest table</li>
                </ul>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Print Layout: 6 tickets, 2×3 grid ── */}
      {qrCode && (
        <div className="print-only tickets-page">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ticket">

              {/* Ornament */}
              <div className="t-ornament">
                <span className="t-line" />
                <span className="t-heart">♥</span>
                <span className="t-line" />
              </div>

              {/* Couple name */}
              <div className="t-couple">{siteConfig.coupleNames}</div>
              <div className="t-subtitle">WEDDING MEMORIES</div>

              {/* Date / Occasion fields */}
              <div className="t-fields">
                <div className="t-field">
                  <span className="t-label">DATE</span>
                  <span className="t-value">{siteConfig.weddingDate}</span>
                </div>
                <div className="t-sep" />
                <div className="t-field">
                  <span className="t-label">OCCASION</span>
                  <span className="t-value">Wedding Celebration</span>
                </div>
              </div>

              {/* Divider */}
              <div className="t-divider" />

              {/* QR code — centrepiece */}
              <div className="t-qr-wrap">
                <img src={qrCode} alt="QR" className="t-qr-img" />
                <div className="t-qr-label">SCAN &amp; SHARE</div>
              </div>

              {/* Divider */}
              <div className="t-divider" />

              {/* Message */}
              <p className="t-message">
                You captured a moment we&apos;ll cherish forever.
                Scan to share your photos from today&apos;s celebration.
              </p>

              {/* URL */}
              <div className="t-url">{galleryUrl}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .print-only { display: none; }

        @media print {
          .no-print  { display: none !important; }
          .print-only { display: block; }

          @page { size: A4 portrait; margin: 8mm; }
          body { margin: 0; background: white; }

          /* 2 columns × 3 rows */
          .tickets-page {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, 1fr);
            gap: 5mm;
            width: 100%;
            height: 277mm; /* A4 height minus margins */
            box-sizing: border-box;
          }

          /* Ticket card */
          .ticket {
            border: 1.5px solid #c9a86c;
            border-radius: 5px;
            background: #faf8f5;
            font-family: 'Cormorant Garamond', Georgia, serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 4mm 5mm 3mm;
            box-sizing: border-box;
            position: relative;
          }

          /* Dashed cut guides between tickets (via outline trick) */
          .ticket {
            outline: 1px dashed #d4b896;
            outline-offset: 2mm;
          }

          /* Ornament */
          .t-ornament {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 3px;
            margin-bottom: 2mm;
          }
          .t-line  { flex: 1; height: 0.5px; background: #c9a86c; }
          .t-heart { color: #c9a86c; font-size: 7pt; line-height: 1; }

          /* Couple name */
          .t-couple {
            font-size: 14pt;
            font-weight: 600;
            color: #1c1810;
            letter-spacing: 0.01em;
            text-align: center;
            line-height: 1.1;
          }

          /* "Wedding Memories" subtitle */
          .t-subtitle {
            font-size: 5.5pt;
            letter-spacing: 0.22em;
            color: #8a6a3a;
            text-transform: uppercase;
            margin-top: 1mm;
            font-weight: 500;
          }

          /* Date / Occasion row */
          .t-fields {
            display: flex;
            align-items: flex-start;
            gap: 4mm;
            margin-top: 2.5mm;
            width: 100%;
            justify-content: center;
          }
          .t-sep {
            width: 0.5px;
            background: #d4b896;
            align-self: stretch;
            margin: 1mm 0;
          }
          .t-field  { display: flex; flex-direction: column; gap: 0.5mm; }
          .t-label  { font-size: 5pt; letter-spacing: 0.2em; color: #8a6a3a; font-weight: 500; }
          .t-value  { font-size: 7.5pt; color: #1c1810; font-weight: 600; }

          /* Horizontal rule */
          .t-divider {
            width: 100%;
            height: 0.5px;
            background: #e8d9c0;
            margin: 2mm 0;
          }

          /* QR code block */
          .t-qr-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1mm;
          }
          .t-qr-img {
            width: 26mm;
            height: 26mm;
            display: block;
          }
          .t-qr-label {
            font-size: 5.5pt;
            letter-spacing: 0.2em;
            font-weight: 700;
            color: #c9a86c;
          }

          /* Message */
          .t-message {
            font-size: 7pt;
            color: #3d2e1a;
            line-height: 1.55;
            font-style: italic;
            text-align: center;
            margin: 0;
          }

          /* URL */
          .t-url {
            font-size: 5pt;
            color: #a07840;
            font-family: 'Courier New', monospace;
            margin-top: 1.5mm;
            letter-spacing: 0.04em;
          }
        }
      `}</style>
    </>
  )
}
