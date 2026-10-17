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
  let next = '/'
  if (requestedNext?.startsWith('/') && !requestedNext.startsWith('//')) {
    try {
      const destination = new URL(requestedNext, appUrl.origin)
      if (destination.origin === appUrl.origin) {
        next = `${destination.pathname}${destination.search}${destination.hash}`
      }
    } catch {
      next = '/'
    }
  }

  if (!code) {
    const failure = new URL('/connect/sign-in', appUrl.origin)
    failure.searchParams.set('authError', 'google_auth_failed')
    return NextResponse.redirect(failure)
  }

  try {
    const supabase = await createConnectSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    const destination = new URL(next, appUrl.origin)
    if (error) {
      const failure = new URL('/connect/sign-in', appUrl.origin)
      failure.searchParams.set('authError', 'google_auth_failed')
      return NextResponse.redirect(failure)
    }
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (userData.user?.email && userData.user.email_confirmed_at) {
      try {
        const confirmedAt = new Date(userData.user.email_confirmed_at)
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
    return NextResponse.redirect(destination)
  } catch (error) {
    console.error('Connect auth callback failed:', error)
    const destination = new URL('/connect/sign-in', appUrl.origin)
    destination.searchParams.set('authError', 'google_auth_failed')
    return NextResponse.redirect(destination)
  }
}
