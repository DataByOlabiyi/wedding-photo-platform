'use client'

import { useState, useRef, useCallback } from 'react'
import {
  ArrowLeft, Camera, Upload, CheckCircle2, AlertCircle,
  Loader2, ImagePlus, X, Heart, Sparkles, User, Tag, ArrowRight,
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

const MAX_IMAGE_SIZE_MB = 50
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

      // Magic-byte validation (server-side validation also occurs in requestSignedUploadUrl)
      const formData = new FormData()
      formData.append('file', file)
      const validateRes = await fetch('/api/upload/validate', { method: 'POST', body: formData })
      if (!validateRes.ok) {
        const { error } = await validateRes.json()
        throw new Error(error || 'File type not allowed')
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
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="font-serif text-lg font-semibold">{coupleNames ?? eventName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Add Photos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {step === 'info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold">Share Your Memories</h1>
              {weddingDate && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <p className="mt-2 text-muted-foreground">Tell us a bit about yourself first</p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  How do you know the couple?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {GUEST_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setGuestTag(tag)}
                      className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        guestTag === tag
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={!guestName.trim()} className="w-full gap-2 rounded-full h-12 text-base" size="lg">
                Continue to Upload
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {step === 'upload' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold">Upload Your Photos</h1>
              <p className="mt-2 text-muted-foreground">Help us capture every beautiful moment</p>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {guestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{guestName}</p>
                  {guestTag && <p className="text-xs text-muted-foreground">{guestTag}</p>}
                </div>
              </div>
              <button onClick={() => setStep('info')} className="text-sm text-primary hover:underline">Change</button>
            </div>

            <div className="mb-6 rounded-2xl border border-border/50 bg-muted/40 px-4 py-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">What you can share</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Photos only — JPEG, PNG, HEIC</li>
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Up to <strong>{MAX_FILES} photos</strong> per upload</li>
                <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Max <strong>{MAX_IMAGE_SIZE_MB} MB</strong> per photo</li>
              </ul>
            </div>

            <div
              onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)) }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${
                isDragging
                  ? 'border-primary/60 bg-primary/8 scale-[1.02] shadow-lg'
                  : 'border-border/60 bg-gradient-to-b from-primary/5 to-background hover:border-primary/40'
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all ${isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10'}`}>
                  <Upload className={`h-10 w-10 ${isDragging ? 'text-primary' : 'text-primary/70'}`} />
                </div>
                <h3 className="font-serif text-xl font-semibold">{isDragging ? 'Drop your memories here' : 'Share Your Memories'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Drag and drop or tap to select</p>
                <p className="mt-3 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  Photos only · Up to {MAX_FILES} files · Max {MAX_IMAGE_SIZE_MB}MB each
                </p>
              </div>
            </div>

            {uploads.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                    {allComplete && <Sparkles className="h-5 w-5 text-primary" />}
                    {allComplete ? 'Upload Complete!' : 'Uploading…'}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
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
                    <Button onClick={() => setStep('success')} className="w-full rounded-full" size="lg">Continue</Button>
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
    <div className="flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-border/50">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
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
        <button onClick={onRemove} className="flex-shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
