import JSZip from 'jszip'
import type { MediaItem } from '@/lib/types'

/**
 * Downloads multiple media items as a ZIP file
 * @param items - Array of media items to download
 * @param fileName - Name of the ZIP file (without .zip extension)
 */
export async function downloadAsZip(items: MediaItem[], fileName: string = 'wedding-photos') {
  const zip = new JSZip()
  let itemCount = 0

  for (const item of items) {
    try {
      const response = await fetch(item.file_url)
      if (!response.ok) continue

      const blob = await response.blob()
      const ext = item.media_type === 'video' ? 'mp4' : 'jpg'
      const itemName = `${item.uploaded_by}/${itemCount + 1}.${ext}`
      
      zip.file(itemName, blob)
      itemCount++
    } catch (error) {
      console.error('[v0] Failed to download file:', error)
    }
  }

  if (itemCount === 0) {
    alert('Failed to download files')
    return
  }

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[v0] Failed to create ZIP:', error)
    alert('Failed to create ZIP file')
  }
}

/**
 * Downloads media items grouped by uploader as a ZIP file
 */
export async function downloadByUploaderAsZip(items: MediaItem[], uploaderName: string) {
  const zip = new JSZip()
  let itemCount = 0

  const uploaderItems = items.filter((item) => item.uploaded_by === uploaderName)

  for (const item of uploaderItems) {
    try {
      const response = await fetch(item.file_url)
      if (!response.ok) continue

      const blob = await response.blob()
      const ext = item.media_type === 'video' ? 'mp4' : 'jpg'
      const itemName = `${itemCount + 1}.${ext}`
      
      zip.file(itemName, blob)
      itemCount++
    } catch (error) {
      console.error('[v0] Failed to download file:', error)
    }
  }

  if (itemCount === 0) {
    alert('No files to download')
    return
  }

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${uploaderName}-photos-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[v0] Failed to create ZIP:', error)
    alert('Failed to create ZIP file')
  }
}
