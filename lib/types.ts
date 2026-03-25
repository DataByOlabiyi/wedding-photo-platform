export type MediaItem = {
  id: string
  file_url: string
  thumbnail_url: string | null
  media_type: "image" | "video"
  uploaded_by: string
  file_size: number | null
  width: number | null
  height: number | null
  uploaded_at: string
}

export type GuestIdentity = {
  guestId: string
  guestName: string
  guestTag?: string
}

export type GuestFolder = {
  guestId: string
  guestName: string
  guestTag?: string
  photoCount: number
  coverImage: string
  lastUpdated: string
}

export type UploadQueueItem = {
  id: string
  file: File
  guestId: string
  guestName: string
  guestTag?: string
  caption?: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}
