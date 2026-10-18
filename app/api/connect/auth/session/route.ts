import { NextResponse } from 'next/server'
import { getAuthenticatedMember } from '@/lib/connect/auth'
import { prisma } from '@/lib/prisma'
import {
  ConnectRequestError,
  normalizeSignupUsn,
  rethrowNextControlFlow,
} from '@/lib/connect/validation'

export async function GET() {
  try {
    const user = await getAuthenticatedMember()
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const profile = await prisma.memberProfile.findUnique({
      where: { authUserId: user.id },
      select: { slug: true, visibility: true },
    })
    const registration = await prisma.connectRegistration.findUnique({
      where: { authUserId: user.id },
      select: { usn: true },
    }) ?? (user.email
      ? await prisma.connectRegistration.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { usn: true, authUserId: true },
        }).then((record) => record?.authUserId ? null : record)
      : null)
    let connectUsn = registration?.usn ?? null
    if (!connectUsn && typeof user.user_metadata?.connect_usn === 'string') {
      try {
        connectUsn = normalizeSignupUsn(user.user_metadata.connect_usn)
      } catch (error) {
        if (!(error instanceof ConnectRequestError)) throw error
      }
    }
    return NextResponse.json(
      {
        authenticated: true,
        emailVerified: Boolean(user.email_confirmed_at),
        user: {
          id: user.id,
          email: user.email ?? null,
          connectUsn,
        },
        profile,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    rethrowNextControlFlow(error)
    console.error('Connect session lookup failed:', error)
    return NextResponse.json({ error: 'Unable to verify the current session.' }, { status: 500 })
  }
}
