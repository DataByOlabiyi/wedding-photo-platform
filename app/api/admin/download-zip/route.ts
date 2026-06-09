import { NextRequest } from "next/server"
import JSZip from "jszip"
import { jwtVerify } from "jose"
import { createAdminClientUnchecked } from "@/lib/supabase/admin"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

async function verifyRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin_token")?.value
  if (!token) return false
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const uploader = searchParams.get("uploader") // optional — filter by uploader

  const supabase = createAdminClientUnchecked()

  let query = supabase
    .from("media")
    .select("id, file_url, uploaded_by, media_type, uploaded_at")
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })

  if (uploader) {
    query = query.eq("uploaded_by", uploader)
  }

  const { data: items, error } = await query

  if (error || !items?.length) {
    return new Response("No media found", { status: 404 })
  }

  const zip = new JSZip()

  // Fetch and add each file sequentially to keep memory bounded
  for (const item of items) {
    try {
      const res = await fetch(item.file_url)
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const ext = item.media_type === "video" ? "mp4" : "jpg"
      const safeUploader = item.uploaded_by.replace(/[^a-z0-9_\- ]/gi, "_")
      const name = `${safeUploader}/${new Date(item.uploaded_at).toISOString().slice(0, 10)}-${item.id.slice(0, 8)}.${ext}`
      zip.file(name, buf)
    } catch {
      // Skip files that fail to fetch — don't abort the whole archive
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })

  const label = uploader
    ? `${uploader.replace(/[^a-z0-9_\- ]/gi, "_")}-photos`
    : "wedding-photos"

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${label}-${Date.now()}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  })
}
