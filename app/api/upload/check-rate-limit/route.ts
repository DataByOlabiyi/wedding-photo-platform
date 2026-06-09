import { checkUploadRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST() {
  const headersList = await headers()
  // x-vercel-forwarded-for is set by Vercel infrastructure and cannot be spoofed
  // by the client. Fall back to x-forwarded-for only in local dev.
  const ip =
    headersList.get('x-vercel-forwarded-for') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const { allowed, remaining, resetTime } = await checkUploadRateLimit(ip)

  if (!allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        message: 'You have reached the maximum number of uploads per hour (30 files). Please try again later.',
        resetTime,
      },
      { status: 429 }
    )
  }

  return Response.json({ allowed: true, remaining, resetTime })
}
