import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedConnectAdmin } from '@/lib/connect/auth'
import {
  ConnectRequestError,
  normalizePersonName,
  rethrowNextControlFlow,
  requestErrorResponse,
} from '@/lib/connect/validation'

function parsePage(value: string | null, name: string, max: number) {
  if (value === null) return 1
  if (!/^\d+$/.test(value)) throw new ConnectRequestError(`${name} must be a positive integer.`)
  const number = Number(value)
  if (number < 1 || number > max) {
    throw new ConnectRequestError(`${name} must be between 1 and ${max}.`)
  }
  return number
}

function isModeratorRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!isModeratorRole(admin.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parsePage(searchParams.get('page'), 'page', 1_000_000)
    const limit = parsePage(searchParams.get('limit'), 'limit', 100)
    const where = { approvalStatus: 'PENDING' as const }

    const [profiles, total] = await prisma.$transaction([
      prisma.memberProfile.findMany({
        where,
        select: {
          authUserId: true,
          slug: true,
          usn: true,
          visibility: true,
          fullName: true,
          graduationYear: true,
          memberType: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.memberProfile.count({ where }),
    ])

    const roster = await prisma.usnRosterEntry.findMany({
      where: { usn: { in: profiles.map((profile) => profile.usn) }, isActive: true },
      select: { usn: true, fullName: true },
    })
    const rosterNames = new Map(roster.map((entry) => [entry.usn, entry.fullName]))

    return NextResponse.json({
      profiles: profiles.map(({ usn, ...profile }) => {
        const rosterName = rosterNames.get(usn)
        return {
          ...profile,
          usn,
          rosterName: rosterName ?? null,
          rosterNameMatches:
            rosterName !== undefined &&
            normalizePersonName(rosterName) === normalizePersonName(profile.fullName),
        }
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    rethrowNextControlFlow(error)
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect profile moderation list failed:', error)
    return NextResponse.json({ error: 'Failed to load member profiles.' }, { status: 500 })
  }
}
