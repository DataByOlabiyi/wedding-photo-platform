'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Lock, Calendar, Trash2 } from 'lucide-react'
import { updateEventSettings, deleteEvent } from '@/app/actions/event-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface InitialData {
  status: 'open' | 'closed'
  guestsCanViewGallery: boolean
  closesAt: string
  hasPin: boolean
  slug: string
}

export function EventSettingsForm({
  eventId,
  initialData,
  baseUrl,
}: {
  eventId: string
  initialData: InitialData
  baseUrl: string
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'open' | 'closed'>(initialData.status)
  const [guestsCanView, setGuestsCanView] = useState(initialData.guestsCanViewGallery)
  const [closesAt, setClosesAt] = useState(initialData.closesAt)
  const [newPin, setNewPin] = useState('')
  const [hasPin, setHasPin] = useState(initialData.hasPin)

  const save = (overrides?: Record<string, unknown>) => {
    startTransition(async () => {
      const result = await updateEventSettings(eventId, {
        status,
        guestsCanViewGallery: guestsCanView,
        closesAt: closesAt || null,
        pin: newPin || undefined,
        ...overrides,
      })
      if (result?.error) toast.error(result.error)
      else {
        toast.success('Settings saved')
        if (newPin) { setHasPin(true); setNewPin('') }
      }
    })
  }

  const clearPin = () => {
    startTransition(async () => {
      const result = await updateEventSettings(eventId, { clearPin: true })
      if (result?.error) toast.error(result.error)
      else { setHasPin(false); toast.success('PIN removed') }
    })
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon-sm" aria-label="Back to event" className="-ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-caption uppercase tracking-[0.09em] text-muted-foreground/80">Gallery</p>
        </div>
        <h1 className="font-serif text-heading">Event settings</h1>
      </div>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Guest upload link</Label>
            <div className="flex gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-muted px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground">
                {baseUrl}/e/{initialData.slug}
              </code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/e/${initialData.slug}`); toast.success('Copied') }}>
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload access</CardTitle>
          <CardDescription>Control who can upload and when.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Accept uploads</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle off to stop new photo uploads.</p>
            </div>
            <Switch
              checked={status === 'open'}
              onCheckedChange={checked => setStatus(checked ? 'open' : 'closed')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closesAt" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Auto-close date (optional)
            </Label>
            <Input
              id="closesAt"
              type="date"
              value={closesAt}
              onChange={e => setClosesAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Uploads will be blocked after this date. Gallery stays visible.</p>
          </div>
        </CardContent>
      </Card>

      {/* Gallery visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gallery visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Guests can view gallery</Label>
              <p className="text-xs text-muted-foreground mt-0.5">If off, only you can view all uploaded photos.</p>
            </div>
            <Switch checked={guestsCanView} onCheckedChange={setGuestsCanView} />
          </div>
        </CardContent>
      </Card>

      {/* PIN protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            PIN protection
          </CardTitle>
          <CardDescription>Require guests to enter a PIN before uploading.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasPin && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm">PIN is active</span>
              <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={clearPin}>
                Remove PIN
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPin">{hasPin ? 'Change PIN' : 'Set PIN'}</Label>
            <Input
              id="newPin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4–6 digit PIN"
              className="font-mono text-data tracking-[0.2em]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription>Deleting this event removes all photos and guest data permanently.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Delete event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  All photos and guest data for this event will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={() => startTransition(async () => { await deleteEvent(eventId) })}
                >
                  Delete event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={() => save()} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
