import { checkUploadRateLimit, getIp } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST() {
  const headersList = await headers()
  const ip = getIp(headersList)

  const { allowed, remaining, resetTime } = await checkUploadRateLimit(ip)

  if (!allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        message: 'You have reached the maximum number of uploads per hour (60 files). Please try again later.',
        resetTime,
      },
      { status: 429 }
    )
  }

  return Response.json({ allowed: true, remaining, resetTime })
}
