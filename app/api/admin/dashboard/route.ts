import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const [
      totalEvents,
      upcomingEvents,
      publishedAchievements,
      learningResources,
      draftEvents,
      draftAchievements,
      draftResources,
      recentEvents,
      recentAchievements,
      recentResources,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.achievement.count({ where: { status: 'PUBLISHED' } }),
      prisma.learningResource.count({ where: { status: 'PUBLISHED' } }),
      prisma.event.count({ where: { status: 'DRAFT' } }),
      prisma.achievement.count({ where: { status: 'DRAFT' } }),
      prisma.learningResource.count({ where: { status: 'DRAFT' } }),
      prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, category: true, status: true, dateDisplay: true, createdAt: true },
      }),
      prisma.achievement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, category: true, awardOrPosition: true, studentOrTeamName: true, status: true },
      }),
      prisma.learningResource.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, subject: true, semester: true, resourceType: true, status: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, action: true, entity: true, details: true, createdAt: true, ipAddress: true },
      }),
    ])

    const draftContent = draftEvents + draftAchievements + draftResources

    return NextResponse.json({
      metrics: {
        totalEvents,
        upcomingEvents,
        publishedAchievements,
        learningResources,
        draftContent,
      },
      recentEvents,
      recentAchievements,
      recentResources,
      recentAuditLogs,
    })
  } catch (err: unknown) {
    console.error('Dashboard metrics error:', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics.' }, { status: 500 })
  }
}
