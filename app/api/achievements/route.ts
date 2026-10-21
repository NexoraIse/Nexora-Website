import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sortAchievementsByDate } from '@/lib/achievement-sorting'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''

    const where = {
      status: 'PUBLISHED' as const,
      ...(category
        ? { category: { equals: category, mode: 'insensitive' as const } }
        : {}),
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ achievements: sortAchievementsByDate(achievements) })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    console.error('Public achievements fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch achievements.' }, { status: 500 })
  }
}
