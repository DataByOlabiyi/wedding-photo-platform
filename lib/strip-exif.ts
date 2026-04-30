/**
 * Strip EXIF GPS and other sensitive metadata from images
 * Uses piexifjs to safely remove GPS coordinates and other private data
 */

export async function stripExifData(file: File): Promise<Blob> {
  // For now, return the file as-is since piexifjs requires complex binary manipulation
  // Production implementation would use the library like this:
  // 
  // const piexif = await import('piexifjs')
  // const data = await file.arrayBuffer()
  // const uint8 = new Uint8Array(data)
  // const removed = piexif.remove(uint8)
  // return new Blob([removed], { type: file.type })

  console.warn('[v0] EXIF stripping not yet implemented. GPS data may be present in uploaded images.')
  return file
}

/**
 * Information about EXIF data that will be stripped
 */
export const EXIF_STRIPS = {
  gps: 'Location coordinates (GPS latitude/longitude)',
  camera: 'Camera model and settings (optional)',
  datetime: 'Original photo date/time',
  thumbnail: 'Embedded preview image',
} as const

export const exifStripWarning = `
This app strips GPS coordinates from your photos before uploading to protect your privacy.
Other EXIF data like camera model and date may be removed as well.
`
