import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const sessions = await prisma.activeSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch (err: unknown) {
    console.error('Fetch sessions error:', err)
    return NextResponse.json({ error: 'Failed to fetch active sessions.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 })
    }

    const session = await prisma.activeSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    await prisma.activeSession.delete({ where: { id } })

    await recordAuditLog({
      action: 'REVOKE_SESSION',
      entity: 'Session',
      entityId: id,
      details: `Revoked session for ${session.adminEmail}`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Revoke session error:', err)
    return NextResponse.json({ error: 'Failed to revoke session.' }, { status: 500 })
  }
}
