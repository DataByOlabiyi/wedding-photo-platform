export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeMB: 5,
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not create blob"))
            return
          }

          // If still too large, reduce quality
          if (blob.size > opts.maxSizeMB! * 1024 * 1024) {
            canvas.toBlob(
              (smallerBlob) => {
                if (!smallerBlob) {
                  reject(new Error("Could not create smaller blob"))
                  return
                }
                resolve({ blob: smallerBlob, width, height })
              },
              "image/jpeg",
              opts.quality! * 0.7
            )
          } else {
            resolve({ blob, width, height })
          }
        },
        "image/jpeg",
        opts.quality
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export async function generateThumbnail(
  file: File,
  size: number = 400
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Calculate crop dimensions for square thumbnail
      const minDim = Math.min(img.width, img.height)
      const startX = (img.width - minDim) / 2
      const startY = (img.height - minDim) / 2

      canvas.width = size
      canvas.height = size

      ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not create thumbnail blob"))
            return
          }
          resolve(blob)
        },
        "image/jpeg",
        0.8
      )
    }

    img.onerror = () => reject(new Error("Failed to load image for thumbnail"))
    img.src = URL.createObjectURL(file)
  })
}

export async function generateVideoThumbnail(
  file: File,
  size: number = 400
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Calculate crop dimensions for square thumbnail
      const minDim = Math.min(video.videoWidth, video.videoHeight)
      const startX = (video.videoWidth - minDim) / 2
      const startY = (video.videoHeight - minDim) / 2

      canvas.width = size
      canvas.height = size

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src)
          if (!blob) {
            reject(new Error("Could not create video thumbnail blob"))
            return
          }
          resolve(blob)
        },
        "image/jpeg",
        0.8
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error("Failed to load video for thumbnail"))
    }

    video.src = URL.createObjectURL(file)
  })
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/")
}

export function getMediaType(file: File): "photo" | "video" {
  return isVideoFile(file) ? "video" : "photo"
}
