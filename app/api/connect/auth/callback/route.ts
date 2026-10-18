import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createConnectSupabaseServerClient, getConnectAppUrl } from '@/lib/connect/auth'

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  let appUrl: URL
  try {
    appUrl = getConnectAppUrl(req)
  } catch (error) {
    console.error('Connect auth callback configuration error:', error)
    return NextResponse.json(
      { error: 'Connect authentication callback is not configured.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const code = requestUrl.searchParams.get('code')
  const requestedNext = requestUrl.searchParams.get('next')
  let next = '/connect/dashboard'
  if (requestedNext?.startsWith('/') && !requestedNext.startsWith('//')) {
    try {
      const destination = new URL(requestedNext, appUrl.origin)
      if (destination.origin === appUrl.origin) {
        next = `${destination.pathname}${destination.search}${destination.hash}`
      }
    } catch {
      next = '/connect/dashboard'
    }
  }
  if (next === '/connect/start') {
    next = '/connect/dashboard'
  }

  if (!code) {
    const failure = new URL('/connect/sign-in', appUrl.origin)
    failure.searchParams.set('authError', 'google_auth_failed')
    return NextResponse.redirect(failure)
  }

  try {
    const destination = new URL(next, appUrl.origin)
    const response = NextResponse.redirect(destination)
    response.headers.set('Cache-Control', 'no-store')

    const flowId = requestUrl.searchParams.get('sb_flow_id')
    const supabase = await createConnectSupabaseServerClient(response)
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    )
    if (error) {
      console.error('Connect auth callback code exchange failed:', error.message)
      const failure = new URL('/connect/sign-in', appUrl.origin)
      failure.searchParams.set('authError', 'google_auth_failed')
      return NextResponse.redirect(failure)
    }

    supabase.applyCookies(response)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (userData.user?.email) {
      try {
        const confirmedAt = userData.user.email_confirmed_at
          ? new Date(userData.user.email_confirmed_at)
          : new Date()
        const linkedRegistration = await prisma.connectRegistration.findUnique({
          where: { authUserId: userData.user.id },
          select: { id: true },
        })
        if (linkedRegistration) {
          await prisma.connectRegistration.update({
            where: { id: linkedRegistration.id },
            data: { emailConfirmedAt: confirmedAt },
          })
        } else {
          await prisma.connectRegistration.updateMany({
            where: { email: userData.user.email.toLowerCase(), authUserId: null },
            data: { authUserId: userData.user.id, emailConfirmedAt: confirmedAt },
          })
        }
      } catch (registrationError) {
        console.error('Connect registration confirmation sync failed:', registrationError)
      }
    }
    return response
  } catch (error) {
    console.error('Connect auth callback failed:', error)
    const destination = new URL('/connect/sign-in', appUrl.origin)
    destination.searchParams.set('authError', 'google_auth_failed')
    return NextResponse.redirect(destination)
  }
}
