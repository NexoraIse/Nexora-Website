import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // If Supabase OAuth redirects to root or any non-API page with ?code=...,
  // seamlessly forward to the Connect auth callback route.
  if (searchParams.has('code') && !pathname.startsWith('/api/')) {
    const callbackUrl = new URL('/api/connect/auth/callback', request.url)
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(callbackUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images:
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

