'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, Image as ImageIcon, Loader2, Search, Trash2, ExternalLink, Settings, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { deleteMedia } from '@/app/actions/admin-delete'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderPreviewCard } from '@/components/folder-preview-card'
import type { MediaItem } from '@/lib/types'
import Link from 'next/link'

interface Props {
  eventId: string
  eventName: string
  eventSlug: string
  galleryToken: string | null
  status: string
  plan: string
}

type SortOption = 'recent' | 'alphabetical' | 'most-uploads'

export function EventGalleryClient({ eventId, eventName, eventSlug, galleryToken, status, plan }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const uploaderGroupsPerPage = 6

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetchMedia()
  }, [eventId])

  const fetchMedia = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(1000)

    if (!error && data) setMedia(data)
    setIsLoading(false)
  }

  const handleDelete = async (item: MediaItem) => {
    setDeletingId(item.id)
    const result = await deleteMedia(item.id)
    if (result.success) {
      setMedia(prev => prev.filter(m => m.id !== item.id))
      toast.success('Photo deleted')
    } else {
      toast.error('Delete failed', { description: result.error })
    }
    setDeletingId(null)
  }

  const handleDownloadAll = () => {
    if (plan !== 'pro') {
      toast.error('Pro plan required', {
        description: 'Bulk ZIP download is a Pro feature. Upgrade to access it.',
        action: { label: 'Upgrade', onClick: () => window.location.href = '/dashboard/billing' },
      })
      return
    }
    const a = document.createElement('a')
    a.href = `/api/admin/download-zip?eventId=${eventId}`
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const uploaders = useMemo(() => {
    const unique = Array.from(new Set(media.map(m => m.uploaded_by)))
    const filtered = unique.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    return filtered.sort((a, b) => {
      const ma = media.filter(m => m.uploaded_by === a)
      const mb = media.filter(m => m.uploaded_by === b)
      if (sortBy === 'alphabetical') return a.localeCompare(b)
      if (sortBy === 'most-uploads') return mb.length - ma.length
      return Math.max(...mb.map(m => new Date(m.uploaded_at).getTime())) -
             Math.max(...ma.map(m => new Date(m.uploaded_at).getTime()))
    })
  }, [media, searchQuery, sortBy])

  const totalPages = Math.ceil(uploaders.length / uploaderGroupsPerPage)
  const paginatedUploaders = uploaders.slice(
    (currentPage - 1) * uploaderGroupsPerPage,
    currentPage * uploaderGroupsPerPage
  )

  const galleryUrl = galleryToken ? `${baseUrl}/gallery/${eventSlug}?token=${galleryToken}` : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{eventName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={status === 'open' ? 'default' : 'secondary'}>{status}</Badge>
            <span className="text-sm text-muted-foreground">{media.length} photos from {uploaders.length} guests</span>
          </div>
        </div>
        <div className="flex gap-2">
          {galleryUrl && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => { navigator.clipboard.writeText(galleryUrl); toast.success('Gallery link copied') }}
            >
              Copy gallery link
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => { navigator.clipboard.writeText(`${baseUrl}/e/${eventSlug}`); toast.success('Upload link copied') }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Upload link
          </Button>
          <Button
            onClick={handleDownloadAll}
            size="sm"
            className="gap-2 rounded-full"
          >
            {plan !== 'pro' && <Lock className="h-3.5 w-3.5" />}
            <Download className="h-3.5 w-3.5" />
            Download all
          </Button>
          <Link href={`/dashboard/events/${eventId}/settings`}>
            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="most-uploads">Most uploads</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 text-center">
          <ImageIcon className="h-12 w-12 text-primary/40" />
          <p className="font-serif text-xl font-semibold">No photos yet</p>
          <p className="text-sm text-muted-foreground">Share the upload link with your guests to start collecting memories.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 mt-2"
            onClick={() => { navigator.clipboard.writeText(`${baseUrl}/e/${eventSlug}`); toast.success('Upload link copied') }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Copy upload link
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedUploaders.map(uploaderName => {
              const uploaderMedia = media.filter(m => m.uploaded_by === uploaderName)
              return (
                <FolderPreviewCard
                  key={uploaderName}
                  uploaderName={uploaderName}
                  media={uploaderMedia}
                  onDownload={() => {
                    const a = document.createElement('a')
                    a.href = `/api/admin/download-zip?eventId=${eventId}&uploader=${encodeURIComponent(uploaderName)}`
                    a.download = ''
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}
                  isDownloading={false}
                />
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground px-4">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
