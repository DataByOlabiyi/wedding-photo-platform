import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_KEY = process.env.JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY || '')

export async function middleware(request: NextRequest) {
  // Allow access to /admin/login without authentication
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Protect other /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Verify JWT token
      if (!JWT_SECRET_KEY) {
        console.error('[v0] Middleware error: JWT_SECRET not set')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.next()
    } catch (error) {
      console.error('[v0] Token verification failed:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
