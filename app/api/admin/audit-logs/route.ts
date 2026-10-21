import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity') || ''
    const action = searchParams.get('action') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const where: any = {}
    if (entity) where.entity = entity
    if (action) where.action = action

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { email: true, name: true, role: true },
        },
      },
    })

    return NextResponse.json({ logs })
  } catch (err: unknown) {
    console.error('Fetch audit logs error:', err)
    return NextResponse.json({ error: 'Failed to fetch audit logs.' }, { status: 500 })
  }
}
