import { NextResponse } from 'next/server'
import { getAuthenticatedMember } from '@/lib/connect/auth'
import { consumeConnectUsnLookupAttempt, verifySignupUsn } from '@/lib/connect/usn'
import { prisma } from '@/lib/prisma'
import { rethrowNextControlFlow, requestErrorResponse } from '@/lib/connect/validation'

export async function GET(req: Request) {
  try {
    const rateLimit = await consumeConnectUsnLookupAttempt(req)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many USN verification attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rateLimit.retryAfter) },
        }
      )
    }

    const user = await getAuthenticatedMember()
    if (user?.email && user.email_confirmed_at) {
      await prisma.connectRegistration.updateMany({
        where: { email: user.email.toLowerCase(), authUserId: null },
        data: { authUserId: user.id, emailConfirmedAt: new Date(user.email_confirmed_at) },
      })
    }
    const result = await verifySignupUsn(new URL(req.url).searchParams.get('usn'), user?.id)
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: result.status, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json(
      { valid: true, fullName: result.fullName },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    rethrowNextControlFlow(error)
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect USN verification failed:', error)
    return NextResponse.json(
      { error: 'Unable to verify this USN right now.' },
      { status: 500 }
    )
  }
}
