export type MediaItem = {
  id: string
  client_id: string
  url: string
  thumbnail_url: string
  guest_id: string
  guest_name: string
  guest_tag?: string | null
  caption?: string | null
  created_at: string
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
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}
