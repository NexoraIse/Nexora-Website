import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { INITIAL_ACHIEVEMENTS } from '@/lib/data/initial-achievements'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''

    const where: any = {
      status: 'PUBLISHED',
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: [{ achievementDate: 'desc' }, { createdAt: 'desc' }],
    })

    if (achievements.length > 0) {
      return NextResponse.json({ achievements })
    }

    const filtered = category
      ? INITIAL_ACHIEVEMENTS.filter(
          (a) => a.category.toLowerCase() === category.toLowerCase()
        )
      : INITIAL_ACHIEVEMENTS

    return NextResponse.json({ achievements: filtered })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    console.error('Public achievements fetch error:', err)
    return NextResponse.json({ achievements: INITIAL_ACHIEVEMENTS }, { status: 200 })
  }
}
