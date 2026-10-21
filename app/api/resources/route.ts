import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject') || ''
    const semesterStr = searchParams.get('semester') || ''
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search')?.trim() || ''

    const where: any = {
      status: 'PUBLISHED',
    }

    if (subject) {
      where.subject = { equals: subject, mode: 'insensitive' }
    }

    if (semesterStr) {
      const sem = parseInt(semesterStr, 10)
      if (!isNaN(sem)) where.semester = sem
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
    }

    const resources = await prisma.learningResource.findMany({
      where,
      orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ resources })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    console.error('Public learning resources fetch error:', err)
    return NextResponse.json({ resources: [] }, { status: 500 })
  }
}
