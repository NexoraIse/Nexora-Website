import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVerifiedMember, isSameOriginRequest } from '@/lib/connect/auth'
import {
  ConnectRequestError,
  normalizeUsn,
  readJsonObject,
  rethrowNextControlFlow,
  requestErrorResponse,
  requiredString,
} from '@/lib/connect/validation'

function parsePage(value: string | null, name: string, min: number, max: number, fallback: number) {
  if (value === null) return fallback
  if (!/^\d+$/.test(value)) throw new ConnectRequestError(`${name} must be a whole number.`)
  const parsed = Number(value)
  if (parsed < min || parsed > max) {
    throw new ConnectRequestError(`${name} must be between ${min} and ${max}.`)
  }
  return parsed
}

export async function GET(req: Request) {
  try {
    const user = await getVerifiedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parsePage(searchParams.get('page'), 'page', 1, 1_000_000, 1)
    const limit = parsePage(searchParams.get('limit'), 'limit', 1, 50, 20)
    const where = { reporterAuthUserId: user.id }
    const [disputes, total] = await Promise.all([
      prisma.usnDispute.findMany({
        where,
        select: {
          id: true,
          usn: true,
          details: true,
          status: true,
          resolutionNote: true,
          reviewedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.usnDispute.count({ where }),
    ])

    return NextResponse.json(
      { disputes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    rethrowNextControlFlow(error)
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect member dispute list failed:', error)
    return NextResponse.json({ error: 'Failed to load your USN disputes.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const user = await getVerifiedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const body = await readJsonObject(req)
    const usn = normalizeUsn(body.usn)
    const details = requiredString(body.details, 'details', 4000, 10)

    const claim = await prisma.usnClaim.findUnique({
      where: { usn },
      select: { profile: { select: { authUserId: true } } },
    })
    if (!claim) return NextResponse.json({ error: 'USN claim not found.' }, { status: 404 })
    if (claim.profile?.authUserId === user.id) {
      return NextResponse.json({ error: 'You cannot dispute your own USN claim.' }, { status: 400 })
    }

    const existing = await prisma.usnDispute.findFirst({
      where: {
        usn,
        reporterAuthUserId: user.id,
        status: { in: ['OPEN', 'IN_REVIEW'] },
      },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already have an open dispute for this USN.' }, { status: 409 })
    }

    const dispute = await prisma.usnDispute.create({
      data: { usn, reporterAuthUserId: user.id, details },
      select: { id: true, status: true, createdAt: true },
    })

    return NextResponse.json({ success: true, dispute }, { status: 201 })
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError

    console.error('Connect USN dispute submission failed:', error)
    return NextResponse.json({ error: 'Failed to submit the USN dispute.' }, { status: 500 })
  }
}
