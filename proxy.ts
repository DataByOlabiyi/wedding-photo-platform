import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Supabase SSR requires the middleware client to refresh the session cookie
  // on every request so it doesn't expire mid-session.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the session with Supabase's auth server — never trust
  // a locally-decoded JWT for auth decisions.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Couple dashboard: requires a valid session
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  // Superadmin: requires session + is_superadmin in app_metadata (server-only, not user-writable)
  if (pathname.startsWith('/superadmin')) {
    if (!user || user.app_metadata?.is_superadmin !== true) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  // Legacy /admin/* — redirect to dashboard if authenticated, login otherwise.
  // Keeps any old bookmarks working without leaving auth-bypass gaps.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*', '/admin/:path*'],
}
