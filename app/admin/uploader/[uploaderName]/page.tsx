'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Download, Trash2, Video, Checkbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { deleteMedia } from '@/app/actions/admin-delete'
import { downloadByUploaderAsZip } from '@/lib/zip-download'
import { MediaLightbox } from '@/components/media-lightbox'
import type { MediaItem } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function UploaderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const uploaderName = decodeURIComponent(params.uploaderName as string)

  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    fetchUploaderMedia()
  }, [])

  const fetchUploaderMedia = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('uploaded_by', uploaderName)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (!error && data) {
      setMedia(data)
    }
    setIsLoading(false)
  }

  const handleDelete = async (item: MediaItem) => {
    setDeletingId(item.id)
    const result = await deleteMedia(item.id)
    
    if (result.success) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
    } else {
      alert(`Failed to delete: ${result.error}`)
    }
    setDeletingId(null)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadByUploaderAsZip(media, uploaderName)
    } finally {
      setIsDownloading(false)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(media.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMedia = media.slice(startIndex, startIndex + itemsPerPage)

  const photoCount = media.filter((m) => m.media_type === 'image').length
  const videoCount = media.filter((m) => m.media_type === 'video').length

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === paginatedMedia.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedMedia.map((m) => m.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} items?`)) return
    
    setIsDeleting(true)
    let deleted = 0
    
    for (const id of selectedIds) {
      const result = await deleteMedia(id)
      if (result.success) {
        deleted++
      }
    }
    
    setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)))
    setSelectedIds(new Set())
    setIsDeleting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedMedia = selectedIndex !== null ? paginatedMedia[selectedIndex] : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-xl font-semibold">{uploaderName}</h1>
              <p className="text-sm text-muted-foreground">
                {photoCount} photo{photoCount !== 1 ? 's' : ''} {videoCount > 0 && `• ${videoCount} video${videoCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isDownloading || media.length === 0}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download All
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {media.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No media uploaded by this user</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-6 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Selected
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {selectedIds.size} items?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. These items will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {paginatedMedia.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedIndex(idx)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.thumbnail_url || item.file_url}
                      alt={`Photo by ${item.uploaded_by}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                    {item.media_type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {/* Checkbox Overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 bg-black/40"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(item.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="h-5 w-5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this media?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Media Lightbox */}
      {selectedMedia && (
        <MediaLightbox
          media={selectedMedia}
          onClose={() => setSelectedIndex(null)}
          onPrevious={() => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : paginatedMedia.length - 1))}
          onNext={() => setSelectedIndex((i) => (i !== null && i < paginatedMedia.length - 1 ? i + 1 : 0))}
          hasPrevious={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < paginatedMedia.length - 1}
          currentIndex={selectedIndex}
          totalCount={paginatedMedia.length}
        />
      )}
    </div>
  )
}
