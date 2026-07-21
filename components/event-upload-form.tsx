'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, CheckCircle2, AlertCircle, Loader2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { compressImage, generateThumbnail, isImageFile, getMediaType } from '@/lib/image-compression'
import { generateImageHash, isDuplicateImage } from '@/lib/image-hash'
import { GUEST_TAGS, type GuestTag } from '@/lib/types'
import { UploadSuccess } from '@/components/upload-success'
import { UploadProgressBar } from '@/components/upload-progress-bar'
import { validateUploaderName, validateGuestTag, sanitizeInput } from '@/lib/validation-schemas'
import { sendUploadNotification } from '@/app/actions/send-upload-email'
import { requestSignedUploadUrl, confirmUpload } from '@/app/actions/guest-upload'
import { toast } from 'sonner'

interface Props {
  eventId: string
  eventSlug: string
  eventName: string
  coupleNames?: string
  weddingDate?: string
}

interface UploadStatus {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'compressing' | 'uploading' | 'complete' | 'error'
  error?: string
}

const MAX_IMAGE_SIZE_MB = 100
const MAX_FILES = 50
const GUEST_TOKEN_KEY = 'guest_upload_token'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getOrCreateGuestToken(): string {
  try {
    const existing = localStorage.getItem(GUEST_TOKEN_KEY)
    if (existing && UUID_RE.test(existing)) return existing
    const token = crypto.randomUUID()
    localStorage.setItem(GUEST_TOKEN_KEY, token)
    return token
  } catch {
    return crypto.randomUUID()
  }
}

export function EventUploadForm({ eventId, eventSlug, eventName, coupleNames, weddingDate }: Props) {
  const [step, setStep] = useState<'info' | 'upload' | 'success'>('info')
  const [guestName, setGuestName] = useState('')
  const [guestToken, setGuestToken] = useState('')
  const [guestTag, setGuestTag] = useState<GuestTag | ''>('')
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nameValidation = validateUploaderName(guestName)
    if (!nameValidation.valid) {
      toast.error('Invalid name', { description: nameValidation.error })
      return
    }
    if (guestTag) {
      const tagValidation = validateGuestTag(guestTag)
      if (!tagValidation.valid) {
        toast.error('Invalid tag', { description: tagValidation.error })
        return
      }
    }
    setGuestToken(getOrCreateGuestToken())
    setStep('upload')
  }

  const updateUploadStatus = useCallback((index: number, updates: Partial<UploadStatus>) => {
    setUploads(prev => prev.map((u, i) => i === index ? { ...u, ...updates } : u))
  }, [])

  const processFile = useCallback(async (file: File, index: number) => {
    try {
      updateUploadStatus(index, { status: 'compressing', progress: 5 })

      // Magic-byte validation (server-side validation also occurs in requestSignedUploadUrl).
      // Only the file header is sent — the route only ever reads the first 16 bytes — so
      // this stays well under Vercel's 4.5MB function body limit regardless of photo size.
      const formData = new FormData()
      formData.append('file', file.slice(0, 64, file.type), file.name)
      const validateRes = await fetch('/api/upload/validate', { method: 'POST', body: formData })
      if (!validateRes.ok) {
        let message = 'File type not allowed'
        try {
          const body = await validateRes.json()
          message = body.error || message
        } catch {
          message = 'Could not validate photo. Please try again.'
        }
        throw new Error(message)
      }

      updateUploadStatus(index, { progress: 10 })

      let fileToUpload: Blob = file
      let width: number | undefined
      let height: number | undefined
      let thumbnailBlob: Blob | undefined

      if (isImageFile(file)) {
        const compressed = await compressImage(file)
        fileToUpload = compressed.blob
        width = compressed.width
        height = compressed.height
        thumbnailBlob = await generateThumbnail(file)
      }

      updateUploadStatus(index, { status: 'uploading', progress: 30 })

      // Request a server-issued signed URL — server validates PIN, plan limits, rate limit
      const urlResult = await requestSignedUploadUrl({
        eventId,
        fileName: file.name,
        fileType: 'image/jpeg',
        fileSize: fileToUpload.size,
      })

      if ('error' in urlResult) throw new Error(urlResult.error)
      const { uploadUrl, thumbnailUploadUrl, storagePath, thumbnailPath } = urlResult

      updateUploadStatus(index, { progress: 40 })

      // Upload directly to the signed URL (bypasses server bandwidth)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileToUpload,
        headers: { 'Content-Type': 'image/jpeg' },
      })
      if (!uploadRes.ok) throw new Error('Upload failed. Please try again.')

      updateUploadStatus(index, { progress: 65 })

      if (thumbnailBlob) {
        await fetch(thumbnailUploadUrl, {
          method: 'PUT',
          body: thumbnailBlob,
          headers: { 'Content-Type': 'image/jpeg' },
        })
      }

      updateUploadStatus(index, { progress: 80 })

      let imageHash: string | null = null
      if (isImageFile(file)) {
        try { imageHash = await generateImageHash(file) } catch { /* non-critical */ }
      }

      // Confirm upload server-side — server verifies file exists, inserts media row
      const confirmResult = await confirmUpload({
        eventId,
        storagePath,
        thumbnailPath,
        uploadedBy: sanitizeInput(guestName),
        guestTag: guestTag || null,
        guestToken,
        fileSize: fileToUpload.size,
        fileHash: imageHash,
        width,
        height,
      })

      if (!confirmResult.success) throw new Error(confirmResult.error ?? 'Upload confirmation failed')

      updateUploadStatus(index, { status: 'complete', progress: 100 })
    } catch (err) {
      updateUploadStatus(index, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [updateUploadStatus, guestName, guestTag, guestToken, eventId])

  const processFiles = useCallback(async (files: File[]) => {
    const valid: File[] = []
    const rejected: UploadStatus[] = []

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        rejected.push({ file, preview: URL.createObjectURL(file), progress: 0, status: 'error', error: 'Videos are not supported — photos only' })
      } else if (!isImageFile(file)) {
        rejected.push({ file, preview: URL.createObjectURL(file), progress: 0, status: 'error', error: 'Only photos are supported' })
      } else if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        rejected.push({ file, preview: URL.createObjectURL(file), progress: 0, status: 'error', error: `Max ${MAX_IMAGE_SIZE_MB}MB per photo` })
      } else {
        valid.push(file)
      }
    }

    const slots = MAX_FILES - uploads.length
    const accepted = valid.slice(0, slots)
    valid.slice(slots).forEach(file =>
      rejected.push({ file, preview: URL.createObjectURL(file), progress: 0, status: 'error', error: `Maximum ${MAX_FILES} files allowed` })
    )

    if (rejected.length) setUploads(prev => [...prev, ...rejected])
    if (!accepted.length) return

    const newUploads: UploadStatus[] = accepted.map(file => ({
      file, preview: URL.createObjectURL(file), progress: 0, status: 'pending' as const,
    }))
    setUploads(prev => [...prev, ...newUploads])
    setIsUploading(true)

    const startIndex = uploads.length
    let nextIdx = 0
    async function worker() {
      while (true) {
        const i = nextIdx++
        if (i >= accepted.length) break
        await processFile(accepted[i], startIndex + i)
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, accepted.length) }, worker))

    sendUploadNotification(guestName, accepted.length, guestToken, eventId).catch(() => {})
    setIsUploading(false)
  }, [processFile, uploads.length, guestName, guestToken, eventId])

  const removeUpload = (index: number) => {
    setUploads(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const completedCount = uploads.filter(u => u.status === 'complete').length
  const allComplete = uploads.length > 0 && completedCount === uploads.length

  if (step === 'success' && allComplete) {
    return <UploadSuccess guestId={encodeURIComponent(guestName)} guestName={guestName} eventSlug={eventSlug} photoCount={uploads.length} coupleNames={coupleNames ?? eventName ?? ""} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="truncate font-serif text-lg tracking-tight">{coupleNames ?? eventName}</span>
          <span className="shrink-0 text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Add photos</span>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {step === 'info' && (
          <div>
            <div className="mb-8 space-y-3 text-center">
              {weddingDate && (
                <p className="font-mono text-data text-muted-foreground">
                  {new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <h1 className="font-serif text-heading">Share your photos</h1>
              <p className="text-sm text-muted-foreground">First, tell us who you are.</p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="h-12 rounded-lg text-base"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>How do you know the couple?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GUEST_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setGuestTag(tag)}
                      className={`flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                        guestTag === tag
                          ? 'border-transparent bg-primary text-primary-foreground'
                          : 'border-input bg-card text-foreground hover:border-ring/60'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={!guestName.trim()} className="h-12 w-full" size="lg">
                Continue
              </Button>
            </form>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <div className="mb-8 space-y-3 text-center">
              <h1 className="font-serif text-heading">Upload your photos</h1>
              <p className="text-sm text-muted-foreground">Everything you add goes straight into the gallery.</p>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground">
                  {guestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{guestName}</p>
                  {guestTag && <p className="text-xs text-muted-foreground">{guestTag}</p>}
                </div>
              </div>
              <button onClick={() => setStep('info')} className="-mr-3 flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Change</button>
            </div>

            <div className="mb-6 rounded-xl border border-border/70 bg-muted/40 px-4 py-3.5">
              <p className="mb-2 text-caption uppercase tracking-[0.09em] text-muted-foreground/80">What you can share</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Photos only — JPEG, PNG, HEIC</li>
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Up to <span className="font-mono">{MAX_FILES}</span> photos per upload</li>
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Max <span className="font-mono">{MAX_IMAGE_SIZE_MB}</span> MB per photo</li>
              </ul>
            </div>

            <div
              onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)) }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative cursor-pointer overflow-hidden rounded-xl border border-dashed transition-colors duration-150 ${
                isDragging ? 'border-ring bg-secondary/30' : 'border-border bg-card hover:border-ring/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={e => { processFiles(Array.from(e.target.files ?? [])); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <Upload className="mb-4 size-8 text-muted-foreground" />
                <h3 className="font-serif text-subheading">{isDragging ? 'Drop them in' : 'Add your photos'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Drag and drop, or tap to choose</p>
                <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground">
                  {MAX_FILES} photos max · {MAX_IMAGE_SIZE_MB} MB each
                </p>
              </div>
            </div>

            {uploads.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-serif text-subheading">{allComplete ? 'All done' : 'Uploading…'}</h3>
                  <span className="rounded-full bg-muted px-3 py-1 font-mono text-data text-foreground">
                    {completedCount} / {uploads.length}
                  </span>
                </div>

                {!allComplete && (
                  <div className="mb-6">
                    <UploadProgressBar current={completedCount} total={uploads.length} />
                  </div>
                )}

                <div className="space-y-3">
                  {uploads.map((upload, index) => (
                    <UploadItem key={index} upload={upload} onRemove={() => removeUpload(index)} />
                  ))}
                </div>

                {allComplete && (
                  <div className="mt-8">
                    <Button onClick={() => setStep('success')} className="h-12 w-full" size="lg">Continue</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function UploadItem({ upload, onRemove }: { upload: UploadStatus; onRemove: () => void }) {
  const statusConfig = {
    pending:    { icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />, label: 'Waiting…',    color: 'text-muted-foreground' },
    compressing:{ icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,          label: 'Optimizing…', color: 'text-primary' },
    uploading:  { icon: <Upload className="h-4 w-4 text-primary animate-pulse" />,           label: 'Uploading…',  color: 'text-primary' },
    complete:   { icon: <CheckCircle2 className="h-4 w-4 text-success" />,                   label: 'Done',        color: 'text-success' },
    error:      { icon: <AlertCircle className="h-4 w-4 text-destructive" />,                label: upload.error || 'Failed', color: 'text-destructive' },
  }
  const cfg = statusConfig[upload.status]
  const canRemove = upload.status === 'complete' || upload.status === 'error'
  const showProgress = upload.status !== 'complete' && upload.status !== 'error'

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-3">
      <div className="relative size-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
        <img src={upload.preview} alt="" className="h-full w-full object-cover" />
        {upload.status === 'complete' && (
          <div className="absolute inset-0 flex items-center justify-center bg-success/20">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{upload.file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {cfg.icon}
          <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
        </div>
        {showProgress && <Progress value={upload.progress} className="h-1.5 mt-2" />}
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove photo"
          className="flex size-11 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
