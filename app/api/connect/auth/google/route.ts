import { connection, NextResponse } from 'next/server'
import { createConnectSupabaseServerClient, getConnectAppUrl } from '@/lib/connect/auth'

export async function GET(req: Request) {
  await connection()

  let appUrl: URL
  try {
    appUrl = getConnectAppUrl(req)
  } catch (error) {
    console.error('Google sign-in configuration error:', error)
    return NextResponse.json(
      { error: 'Connect sign-in is not configured correctly.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const callback = new URL('/api/connect/auth/callback', appUrl)
    const supabase = await createConnectSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    })

    if (error || !data.url) {
      console.error('Google sign-in could not be started:', error?.message ?? 'Missing OAuth URL.')
      const failure = new URL('/connect/sign-in', appUrl)
      failure.searchParams.set('authError', 'google_auth_failed')
      return NextResponse.redirect(failure)
    }

    const response = NextResponse.redirect(data.url)
    response.headers.set('Cache-Control', 'no-store')
    supabase.applyCookies(response)
    return response
  } catch (error) {
    console.error('Google sign-in request failed:', error)
    const failure = new URL('/connect/sign-in', appUrl)
    failure.searchParams.set('authError', 'google_auth_failed')
    return NextResponse.redirect(failure)
  }
}
