import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVerifiedMember, isSameOriginRequest } from '@/lib/connect/auth'
import {
  ConnectRequestError,
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
    const [reports, total] = await Promise.all([
      prisma.connectReport.findMany({
        where,
        select: {
          id: true,
          target: true,
          reason: true,
          details: true,
          status: true,
          resolutionNote: true,
          reviewedAt: true,
          createdAt: true,
          profile: { select: { slug: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.connectReport.count({ where }),
    ])

    return NextResponse.json(
      { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    rethrowNextControlFlow(error)
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect member report list failed:', error)
    return NextResponse.json({ error: 'Failed to load your reports.' }, { status: 500 })
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
    const slug = requiredString(body.slug, 'slug', 100)
    const reason = requiredString(body.reason, 'reason', 80)
    const details =
      body.details === undefined || body.details === null || body.details === ''
        ? null
        : requiredString(body.details, 'details', 2000)
    const target = body.target
    if (target !== 'PROFILE' && target !== 'KNOWLEDGE_PAGE') {
      throw new ConnectRequestError('target must be PROFILE or KNOWLEDGE_PAGE.')
    }

    const profile = await prisma.memberProfile.findUnique({
      where: { slug },
      select: { authUserId: true },
    })
    if (!profile) return NextResponse.json({ error: 'Report target not found.' }, { status: 404 })
    if (profile.authUserId === user.id) {
      return NextResponse.json({ error: 'You cannot report your own profile.' }, { status: 400 })
    }

    if (target === 'KNOWLEDGE_PAGE') {
      const page = await prisma.memberKnowledgePage.findUnique({
        where: { profileId: profile.authUserId },
        select: { publishedMarkdown: true },
      })
      if (!page?.publishedMarkdown) {
        return NextResponse.json({ error: 'Report target not found.' }, { status: 404 })
      }
    }

    const duplicate = await prisma.connectReport.findFirst({
      where: {
        profileId: profile.authUserId,
        reporterAuthUserId: user.id,
        target,
        status: { in: ['OPEN', 'IN_REVIEW'] },
      },
      select: { id: true },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'You already have an open report for this target.' }, { status: 409 })
    }

    const report = await prisma.connectReport.create({
      data: {
        profileId: profile.authUserId,
        reporterAuthUserId: user.id,
        target,
        reason,
        details,
      },
      select: { id: true, status: true, createdAt: true },
    })

    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError

    console.error('Connect report submission failed:', error)
    return NextResponse.json({ error: 'Failed to submit the report.' }, { status: 500 })
  }
}
