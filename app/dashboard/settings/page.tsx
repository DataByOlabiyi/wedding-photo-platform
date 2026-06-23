'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { deleteAccount } from '@/app/actions/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function AccountSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) {
        toast.error('Deletion failed', { description: result.error })
      }
    })
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and data.</p>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account, all events, and all uploaded photos. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This will permanently delete:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your account and login credentials</li>
                    <li>All your events and settings</li>
                    <li>All photos uploaded by your guests</li>
                  </ul>
                  <span className="block font-medium text-foreground mt-3">
                    Type <strong>DELETE</strong> to confirm.
                  </span>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mt-2"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Permanently delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
