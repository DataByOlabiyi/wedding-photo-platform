"use client"

import { useState, useEffect } from "react"
import { Trash2, Download, Image as ImageIcon, Video, Loader2, ArrowLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { MediaItem } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem("bm_admin_auth")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedia()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("bm_admin_auth", "true")
      setError("")
    } else {
      setError("Incorrect password")
    }
  }

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
    const supabase = createClient()

    try {
      // Extract file paths from URLs
      const fileUrl = new URL(item.file_url)
      const filePath = fileUrl.pathname.split("/").slice(-2).join("/")

      // Delete from storage
      await supabase.storage.from("wedding-media").remove([filePath])

      // Delete thumbnail if exists
      if (item.thumbnail_url) {
        const thumbUrl = new URL(item.thumbnail_url)
        const thumbPath = thumbUrl.pathname.split("/").slice(-2).join("/")
        await supabase.storage.from("wedding-media").remove([thumbPath])
      }

      // Delete from database
      await supabase.from("media").delete().eq("id", item.id)

      // Update local state
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
    } catch (error) {
      console.error("Delete failed:", error)
    }

    setDeletingId(null)
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to manage wedding photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                className="text-center"
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const photoCount = media.filter((m) => m.media_type === "photo").length
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
          <Button onClick={handleDownloadAll} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download All</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
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
      </main>
    </div>
  )
}
