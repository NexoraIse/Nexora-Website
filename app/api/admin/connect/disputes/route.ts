import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedConnectAdmin, isSameOriginRequest } from '@/lib/connect/auth'
import {
  ConnectRequestError,
  readJsonObject,
  requestErrorResponse,
  requiredString,
  uuidString,
} from '@/lib/connect/validation'

function isModeratorRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

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
    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!isModeratorRole(admin.role)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'OPEN'
    if (!['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'].includes(status)) {
      throw new ConnectRequestError('Invalid dispute status filter.')
    }
    const where = status === 'ALL'
      ? {}
      : { status: status as 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' }
    const page = parsePage(searchParams.get('page'), 'page', 1, 1_000_000, 1)
    const limit = parsePage(searchParams.get('limit'), 'limit', 1, 100, 50)
    const [disputes, total] = await Promise.all([
      prisma.usnDispute.findMany({
        where,
        include: {
          claim: {
            select: {
              profile: { select: { fullName: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
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
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect dispute moderation list failed:', error)
    return NextResponse.json({ error: 'Failed to load USN disputes.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }
    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!isModeratorRole(admin.role)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const body = await readJsonObject(req)
    const id = uuidString(body.id, 'id')
    const status = body.status
    if (!['IN_REVIEW', 'RESOLVED', 'DISMISSED'].includes(String(status))) {
      throw new ConnectRequestError('status must be IN_REVIEW, RESOLVED, or DISMISSED.')
    }
    const resolutionNote =
      body.resolutionNote === undefined || body.resolutionNote === null || body.resolutionNote === ''
        ? null
        : requiredString(body.resolutionNote, 'resolutionNote', 2000)
    if (status !== 'IN_REVIEW' && !resolutionNote) {
      throw new ConnectRequestError('A resolutionNote is required when resolving or dismissing a dispute.')
    }

    await prisma.$transaction(async (tx) => {
      await tx.usnDispute.update({
        where: { id },
        data: {
          status: status as 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED',
          resolutionNote,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      })
      await tx.auditLog.create({
        data: {
          action: 'REVIEW',
          entity: 'Connect USN dispute',
          entityId: id,
          details: `USN dispute status changed to ${status}.`,
          adminId: admin.id,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        },
      })
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'USN dispute not found.' }, { status: 404 })
    }
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect dispute moderation update failed:', error)
    return NextResponse.json({ error: 'Failed to update USN dispute.' }, { status: 500 })
  }
}
