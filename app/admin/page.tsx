"use client"

import { useState, useEffect } from "react"
import { Trash2, Download, Image as ImageIcon, Video, Loader2, ArrowLeft, LogOut, QrCode, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { createClient } from "@/lib/supabase/client"
import { deleteMedia } from "@/app/actions/admin-delete"
import type { MediaItem } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("gallery")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("uploaded_at", { ascending: false })

    if (!error && data) {
      setMedia(data)
    }
    setIsLoading(false)
  }

  const handleDelete = async (item: MediaItem) => {
    setDeletingId(item.id)
    
    const result = await deleteMedia(item.id)
    
    if (result.success) {
      // Update local state
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
    } else {
      console.error("Delete failed:", result.error)
      alert(`Failed to delete: ${result.error}`)
    }

    setDeletingId(null)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  const handleDownloadAll = async () => {
    for (const item of media) {
      try {
        const response = await fetch(item.file_url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const ext = item.media_type === "video" ? "mp4" : "jpg"
        a.download = `wedding-${item.id}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error("Download failed:", error)
      }
    }
  }

  const photoCount = media.filter((m) => m.media_type === "image").length
  const videoCount = media.filter((m) => m.media_type === "video").length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/qr">
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
            </Link>
            <Button onClick={handleDownloadAll} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download All</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 w-full justify-start bg-transparent border-b rounded-none h-auto p-0 space-x-8">
            <TabsTrigger 
              value="gallery" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger 
              value="guests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <Users className="h-4 w-4" />
              Guests & RSVPs
            </TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-semibold text-foreground">{media.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{photoCount}</p>
                  <p className="text-sm text-muted-foreground">Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{videoCount}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : media.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No media uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.map((item) => (
              <div key={item.id} className="group relative">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.thumbnail_url || item.file_url}
                    alt={`Photo by ${item.uploaded_by}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                  {item.media_type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {item.uploaded_by}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
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
                          This action cannot be undone. This will permanently delete
                          the {item.media_type} uploaded by {item.uploaded_by}.
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
        )}
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-8">
            <AdminGuestsSection media={media} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface AdminGuestsSectionProps {
  media: MediaItem[]
  isLoading: boolean
}

function AdminGuestsSection({ media, isLoading }: AdminGuestsSectionProps) {
  const guests = Array.from(
    new Map(
      media.map((item) => [
        item.uploaded_by,
        {
          name: item.uploaded_by,
          tag: item.guest_tag || "",
          photoCount: 0,
          lastUpload: item.uploaded_at,
        },
      ])
    ).entries()
  )
    .map(([_, guest]) => ({
      ...guest,
      photoCount: media.filter((m) => m.uploaded_by === guest.name).length,
      lastUpload: media
        .filter((m) => m.uploaded_by === guest.name)
        .reduce((latest, current) => 
          new Date(current.uploaded_at) > new Date(latest.uploaded_at) ? current : latest
        )?.uploaded_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.lastUpload).getTime() - new Date(a.lastUpload).getTime())

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (guests.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No guests have uploaded photos yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Guest Name</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">Photos</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Last Upload</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.name} className="border-b hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{guest.name}</td>
                <td className="py-3 px-4">
                  {guest.tag ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {guest.tag}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not specified</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                    {guest.photoCount}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs">
                  {new Date(guest.lastUpload).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
