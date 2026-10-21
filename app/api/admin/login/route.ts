import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createAdminToken, verifyAdminCredentials, recordAuditLog } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body.email || body.username
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const verification = await verifyAdminCredentials(email, password)
    if (!verification.success || !verification.user) {
      return NextResponse.json(
        { error: verification.error || 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const token = createAdminToken(verification.user)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Store active session in database
    await prisma.activeSession.create({
      data: {
        tokenHash,
        adminEmail: verification.user.email,
        userAgent: req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    }).catch((err) => console.error('Failed to log active session:', err))

    // Record login audit log
    await recordAuditLog({
      action: 'LOGIN',
      entity: 'Authentication',
      entityId: verification.user.id,
      details: `Administrator ${verification.user.email} signed in successfully.`,
      adminId: verification.user.id,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    const cookieStore = await cookies()
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: verification.user.id,
        email: verification.user.email,
        name: verification.user.name,
        role: verification.user.role,
      },
    })
  } catch (err: unknown) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    )
  }
}
