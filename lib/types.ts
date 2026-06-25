export type MediaItem = {
  id: string
  file_url: string
  thumbnail_url: string | null
  media_type: "image" | "video"
  uploaded_by: string
  event_id: string
  guest_tag: string | null
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

export type RSVPStatus = 'pending' | 'accepted' | 'declined'

export interface Guest {
  id: string
  name: string
  email?: string | null
  rsvp_status: RSVPStatus
  uploaded: boolean
  uploaded_at?: string | null
}

export type SignedUploadUrlResult = {
  uploadUrl: string
  thumbnailUploadUrl: string
  storagePath: string
  thumbnailPath: string
}

export type VerifyPinResult = {
  valid: boolean
  needsRehash: boolean
}

export const GUEST_TAGS = [
  "Bride's Friend",
  "Bride's Family",
  "Groom's Friend",
  "Groom's Family",
  "Colleague",
  "Neighbor",
  "Other",
] as const

export type GuestTag = (typeof GUEST_TAGS)[number]
