import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search')?.trim() || ''

    const where: any = {
      status: 'PUBLISHED',
    }

    if (category && category !== 'All Events') {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ events })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    console.error('Public events fetch error:', err)
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}
