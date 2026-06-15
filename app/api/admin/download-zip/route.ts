import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const ZIP_PAGE_SIZE = 150

async function getAuthenticatedOrgId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = createAdminClient()
  const { data } = await db
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  return data?.organization_id ?? null
}

export async function GET(request: NextRequest) {
  const orgId = await getAuthenticatedOrgId(request)
  if (!orgId) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  const uploader = searchParams.get('uploader')
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))

  const db = createAdminClient()

  // Verify the requested event belongs to this org
  if (eventId) {
    const { data: event } = await db
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()
    if (!event) return new Response('Event not found', { status: 404 })
  }

  let query = db
    .from('media')
    .select('id, file_url, uploaded_by, media_type, uploaded_at, event_id')
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
    .range(offset, offset + ZIP_PAGE_SIZE - 1)

  if (eventId) {
    query = query.eq('event_id', eventId)
  } else {
    // Scope to all events in this org
    const { data: events } = await db
      .from('events')
      .select('id')
      .eq('organization_id', orgId)
    const ids = (events ?? []).map(e => e.id)
    if (ids.length === 0) return new Response('No media found', { status: 404 })
    query = query.in('event_id', ids)
  }

  if (uploader) query = query.eq('uploaded_by', uploader)

  const { data: items, error } = await query
  if (error || !items?.length) return new Response('No media found', { status: 404 })

  const zip = new JSZip()

  for (const item of items) {
    try {
      const res = await fetch(item.file_url)
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const ext = item.media_type === 'video' ? 'mp4' : 'jpg'
      const safeUploader = item.uploaded_by.replace(/[^a-z0-9_\- ]/gi, '_')
      zip.file(`${safeUploader}/${new Date(item.uploaded_at).toISOString().slice(0, 10)}-${item.id.slice(0, 8)}.${ext}`, buf)
    } catch {
      // Skip files that fail to fetch
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const hasMore = items.length === ZIP_PAGE_SIZE
  const pageLabel = offset > 0 ? `-part${Math.floor(offset / ZIP_PAGE_SIZE) + 1}` : ''
  const baseName = uploader ? `${uploader.replace(/[^a-z0-9_\- ]/gi, '_')}-photos` : 'wedding-photos'

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${baseName}${pageLabel}-${Date.now()}.zip"`,
      'Content-Length': String(zipBuffer.length),
      'X-Has-More': hasMore ? 'true' : 'false',
      'X-Next-Offset': String(offset + ZIP_PAGE_SIZE),
    },
  })
}
