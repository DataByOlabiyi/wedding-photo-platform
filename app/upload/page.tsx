"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImagePlus,
  X,
  Heart,
  Sparkles,
  User,
  Tag,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import {
  compressImage,
  generateThumbnail,
  generateVideoThumbnail,
  isImageFile,
  isVideoFile,
  getMediaType,
} from "@/lib/image-compression"
import { useMedia } from "@/lib/media-context"
import { GUEST_TAGS, type GuestTag } from "@/lib/types"

interface UploadStatus {
  file: File
  preview: string
  progress: number
  status: "pending" | "compressing" | "uploading" | "complete" | "error"
  error?: string
}

const MAX_FILE_SIZE_MB = 50
const MAX_FILES = 10

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<"info" | "upload">("info")
  const [guestName, setGuestName] = useState("")
  const [guestTag, setGuestTag] = useState<GuestTag | "">("")
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addMedia } = useMedia()

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (guestName.trim()) {
      setStep("upload")
    }
  }

  const updateUploadStatus = useCallback(
    (index: number, updates: Partial<UploadStatus>) => {
      setUploads((prev) =>
        prev.map((upload, i) => (i === index ? { ...upload, ...updates } : upload))
      )
    },
    []
  )

  const processFile = useCallback(
    async (file: File, index: number) => {
      const supabase = createClient()

      try {
        updateUploadStatus(index, { status: "compressing", progress: 10 })

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

        if (isVideoFile(file)) {
          try {
            thumbnailBlob = await generateVideoThumbnail(file)
          } catch {
            // Video thumbnail generation may fail on some browsers
          }
        }

        updateUploadStatus(index, { progress: 30 })
        updateUploadStatus(index, { status: "uploading", progress: 40 })

        const timestamp = Date.now()
        const ext = isVideoFile(file) ? "mp4" : "jpg"
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = `uploads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("wedding-media")
          .upload(filePath, fileToUpload, {
            contentType: isVideoFile(file) ? file.type : "image/jpeg",
            cacheControl: "3600",
          })

        if (uploadError) throw uploadError

        updateUploadStatus(index, { progress: 70 })

        let thumbnailPath: string | undefined
        if (thumbnailBlob) {
          const thumbFileName = `${timestamp}-thumb.jpg`
          thumbnailPath = `thumbnails/${thumbFileName}`

          await supabase.storage
            .from("wedding-media")
            .upload(thumbnailPath, thumbnailBlob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            })
        }

        updateUploadStatus(index, { progress: 85 })

        const { data: { publicUrl: fileUrl } } = supabase.storage
          .from("wedding-media")
          .getPublicUrl(filePath)

        let thumbnailUrl: string | undefined
        if (thumbnailPath) {
          const { data: { publicUrl } } = supabase.storage
            .from("wedding-media")
            .getPublicUrl(thumbnailPath)
          thumbnailUrl = publicUrl
        }

        const { data: mediaData, error: dbError } = await supabase
          .from("media")
          .insert({
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            media_type: getMediaType(file),
            uploaded_by: guestName.trim(),
            guest_tag: guestTag || null,
            file_size: fileToUpload.size,
            width,
            height,
          })
          .select()
          .single()

        if (dbError) throw dbError

        if (mediaData) {
          addMedia(mediaData)
        }

        updateUploadStatus(index, { status: "complete", progress: 100 })
      } catch (error) {
        updateUploadStatus(index, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        })
      }
    },
    [updateUploadStatus, addMedia, guestName, guestTag]
  )

  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => {
        if (!isImageFile(file) && !isVideoFile(file)) return false
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false
        return true
      }).slice(0, MAX_FILES)

      if (validFiles.length === 0) {
        alert("No valid files selected. Please choose images or videos under 50MB.")
        return
      }

      const newUploads: UploadStatus[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }))

      setUploads((prev) => [...prev, ...newUploads])
      setIsUploading(true)

      const startIndex = uploads.length
      // Process files in parallel with max 3 concurrent uploads
      const concurrency = 3
      const promises: Promise<void>[] = []
      
      for (let i = 0; i < validFiles.length; i++) {
        const promise = processFile(validFiles[i], startIndex + i)
        promises.push(promise)
        
        // Limit concurrency
        if (promises.length >= concurrency) {
          await Promise.race(promises)
          promises.splice(promises.findIndex(p => !p), 1)
        }
      }
      
      await Promise.all(promises)
      setIsUploading(false)
    },
    [processFile, uploads.length]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      processFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [processFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [processFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeUpload = (index: number) => {
    setUploads((prev) => {
      const removed = prev[index]
      URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const completedCount = uploads.filter((u) => u.status === "complete").length
  const allComplete = uploads.length > 0 && completedCount === uploads.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">
              Add Photos
            </span>
          </div>
          
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Step 1: Guest Info */}
        {step === "info" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Share Your Memories
              </h1>
              <p className="mt-2 text-muted-foreground">
                Tell us a bit about yourself first
              </p>
            </div>

            {/* Info Form */}
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              {/* Name Input */}
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
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card text-base"
                  required
                />
              </div>

              {/* Tag Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  How do you know the couple?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {GUEST_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setGuestTag(tag)}
                      className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        guestTag === tag
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                type="submit"
                disabled={!guestName.trim()}
                className="w-full gap-2 rounded-full h-12 text-base"
                size="lg"
              >
                Continue to Upload
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === "upload" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Upload Your Photos
              </h1>
              <p className="mt-2 text-muted-foreground">
                Help us capture every beautiful moment
              </p>
            </div>

            {/* User Info */}
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {guestName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{guestName}</p>
                  {guestTag && (
                    <p className="text-xs text-muted-foreground">{guestTag}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setStep("info")}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isUploading}
              />
              
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                  isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"
                }`}>
                  <Upload className={`h-10 w-10 transition-colors ${
                    isDragging ? "text-primary" : "text-primary/70"
                  }`} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  {isDragging ? "Drop to upload" : "Add Photos & Videos"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop or tap to select
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to {MAX_FILES} files, max {MAX_FILE_SIZE_MB}MB each
                </p>
              </div>
            </div>

            {/* Upload Queue */}
            {uploads.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    {allComplete && <Sparkles className="h-5 w-5 text-primary" />}
                    {allComplete ? "Upload Complete!" : "Uploading..."}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {completedCount} / {uploads.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {uploads.map((upload, index) => (
                    <UploadItem
                      key={index}
                      upload={upload}
                      onRemove={() => removeUpload(index)}
                    />
                  ))}
                </div>

                {allComplete && (
                  <div className="mt-8 space-y-3">
                    <Button
                      onClick={() => router.push("/")}
                      className="w-full rounded-full"
                      size="lg"
                    >
                      View Gallery
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUploads([])}
                      className="w-full rounded-full"
                      size="lg"
                    >
                      Upload More
                    </Button>
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

function UploadItem({
  upload,
  onRemove,
}: {
  upload: UploadStatus
  onRemove: () => void
}) {
  const statusConfig = {
    pending: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
      label: "Waiting...",
      color: "text-muted-foreground",
    },
    compressing: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
      label: "Optimizing...",
      color: "text-primary",
    },
    uploading: {
      icon: <Upload className="h-4 w-4 text-primary animate-pulse" />,
      label: "Uploading...",
      color: "text-primary",
    },
    complete: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      label: "Done",
      color: "text-green-600",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      label: upload.error || "Failed",
      color: "text-destructive",
    },
  }

  const status = statusConfig[upload.status]
  const canRemove = upload.status === "complete" || upload.status === "error"
  const showProgress = upload.status !== "complete" && upload.status !== "error"

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-border/50 transition-all hover:ring-border">
      {/* Preview */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={upload.preview}
          alt=""
          className="h-full w-full object-cover"
        />
        {upload.status === "complete" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-600/20">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {upload.file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {status.icon}
          <span className={`text-xs ${status.color}`}>
            {status.label}
          </span>
        </div>
        {showProgress && (
          <Progress value={upload.progress} className="h-1.5 mt-2" />
        )}
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
