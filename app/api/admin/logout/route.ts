import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await prisma.activeSession.deleteMany({
        where: { tokenHash },
      }).catch(() => {})
    }

    if (admin) {
      await recordAuditLog({
        action: 'LOGOUT',
        entity: 'Authentication',
        entityId: admin.id,
        details: `Administrator ${admin.email} signed out.`,
        adminId: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      })
    }

    cookieStore.delete('admin_session')
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Logout error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
