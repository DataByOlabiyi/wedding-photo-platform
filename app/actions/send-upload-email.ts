'use server'

import { headers } from 'next/headers'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkEmailNotificationRateLimit, getIp } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'noreply@resend.dev'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Looks up the notification email for an event's org:
// 1. organizations.notification_email (set by couple in settings)
// 2. auth user's email for the org owner
// 3. COUPLE_EMAIL env var (legacy single-tenant fallback)
async function resolveNotificationEmail(eventId: string): Promise<string | null> {
  const db = createAdminClient()
  const { data } = await db
    .from('events')
    .select('organization_id, organizations(notification_email)')
    .eq('id', eventId)
    .single()

  if (!data) return process.env.COUPLE_EMAIL || null

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations as { notification_email: string | null } | null

  if (org?.notification_email) return org.notification_email

  // Fall back to the org owner's auth email
  const { data: member } = await db
    .from('org_members')
    .select('user_id')
    .eq('organization_id', data.organization_id)
    .eq('role', 'owner')
    .maybeSingle()

  if (member?.user_id) {
    const { data: authUser } = await db.auth.admin.getUserById(member.user_id)
    if (authUser.user?.email) return authUser.user.email
  }

  return process.env.COUPLE_EMAIL || null
}

export async function sendUploadNotification(
  guestName: string,
  photoCount: number,
  guestId: string,
  eventId?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate eventId format before any DB interaction
  if (eventId && !UUID_RE.test(eventId)) {
    return { success: false, error: 'Invalid event ID' }
  }

  // Rate-limit this action to prevent bulk email triggering by guests
  const headersList = await headers()
  const ip = getIp(headersList)
  const { allowed } = await checkEmailNotificationRateLimit(ip)
  if (!allowed) {
    return { success: false, error: 'Rate limit exceeded' }
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('Email notifications not configured')
    return { success: false, error: 'Email service not configured' }
  }

  const toEmail = eventId
    ? await resolveNotificationEmail(eventId)
    : (process.env.COUPLE_EMAIL || null)

  if (!toEmail) {
    console.warn('No notification email configured for event', eventId)
    return { success: false, error: 'No notification email configured' }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://localhost:3000'
    const guestLink = `${baseUrl}/guest/${guestId}`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${guestName} shared ${photoCount} photo${photoCount > 1 ? 's' : ''} from your wedding`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New photos from ${guestName}!</h2>
          <p style="color: #666; font-size: 16px;">
            ${guestName} just uploaded <strong>${photoCount} photo${photoCount > 1 ? 's' : ''}</strong> from your wedding.
          </p>

          <div style="margin: 30px 0;">
            <a href="${guestLink}" style="
              background-color: #2d9d78;
              color: white;
              padding: 12px 32px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              font-weight: bold;
            ">View ${guestName}'s Album</a>
          </div>

          <p style="color: #999; font-size: 14px;">
            You received this email because you are the couple for this wedding photo gallery.
          </p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send upload email:', error)
    return { success: false, error: 'Failed to send email notification' }
  }
}
