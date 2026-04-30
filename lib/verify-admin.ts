import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this')

export async function verifyAdminToken(): Promise<boolean> {
  try {
    const cookieJar = await cookies()
    const token = cookieJar.get('admin_token')?.value

    if (!token) return false

    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}
