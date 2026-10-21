import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedConnectAdmin, isSameOriginRequest } from '@/lib/connect/auth'
import {
  booleanValue,
  ConnectRequestError,
  isRecord,
  normalizePersonName,
  normalizeUsn,
  readJsonObject,
  requestErrorResponse,
  requiredString,
} from '@/lib/connect/validation'

function requireSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN'
}

function parsePage(value: string | null, name: string, max: number): number {
  if (value === null) return 1
  if (!/^\d+$/.test(value)) throw new ConnectRequestError(`${name} must be a positive integer.`)
  const parsed = Number(value)
  if (parsed < 1 || parsed > max) {
    throw new ConnectRequestError(`${name} must be between 1 and ${max}.`)
  }
  return parsed
}

async function writeRosterAudit(
  tx: Prisma.TransactionClient,
  adminId: string,
  req: Request,
  action: string,
  details: string
) {
  await tx.auditLog.create({
    data: {
      action,
      entity: 'Connect USN roster',
      details,
      adminId,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    },
  })
}

async function syncProfileName(
  tx: Prisma.TransactionClient,
  usn: string,
  fullName: string
) {
  const profile = await tx.memberProfile.findUnique({
    where: { usn },
    select: { authUserId: true, fullName: true },
  })
  if (!profile || profile.fullName === fullName) return

  const identityChanged = normalizePersonName(profile.fullName) !== normalizePersonName(fullName)
  await tx.memberProfile.update({
    where: { authUserId: profile.authUserId },
    data: {
      fullName,
      ...(identityChanged
        ? {
            approvalStatus: 'PENDING',
            reviewedById: null,
            reviewedAt: null,
            reviewNote: 'Official roster name changed; re-review required.',
          }
        : {}),
    },
  })
}

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!requireSuperAdmin(admin.role)) {
      return NextResponse.json({ error: 'Only a super administrator may manage the roster.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parsePage(searchParams.get('page'), 'page', 1_000_000)
    const limit = parsePage(searchParams.get('limit'), 'limit', 100)
    const status = searchParams.get('status') ?? 'active'
    if (!['active', 'inactive', 'all'].includes(status)) {
      throw new ConnectRequestError('status must be active, inactive, or all.')
    }
    const search = searchParams.get('q')?.trim() ?? ''
    if (search.length > 100) throw new ConnectRequestError('q cannot exceed 100 characters.')

    const where: Prisma.UsnRosterEntryWhereInput = {
      ...(status === 'all' ? {} : { isActive: status === 'active' }),
      ...(search
        ? {
            OR: [
              { usn: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [entries, total] = await Promise.all([
      prisma.usnRosterEntry.findMany({
        where,
        select: { usn: true, fullName: true, isActive: true, importedAt: true },
        orderBy: [{ fullName: 'asc' }, { usn: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.usnRosterEntry.count({ where }),
    ])

    return NextResponse.json(
      { entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect roster fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load the USN roster.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!requireSuperAdmin(admin.role)) {
      return NextResponse.json({ error: 'Only a super administrator may manage the roster.' }, { status: 403 })
    }

    const body = await readJsonObject(req, 5 * 1024 * 1024)
    if (Array.isArray(body.entries)) {
      if (body.entries.length === 0 || body.entries.length > 8000) {
        throw new ConnectRequestError('Provide between 1 and 8,000 roster entries.')
      }
      const replace = body.replace === undefined ? false : booleanValue(body.replace, 'replace')
      const entries = body.entries.map((entry, index) => {
        if (!isRecord(entry)) throw new ConnectRequestError(`entries[${index}] must be an object.`)
        return {
          usn: normalizeUsn(entry.usn),
          fullName: requiredString(entry.fullName, `entries[${index}].fullName`, 120),
        }
      })

      const namesByUsn = new Map<string, string>()
      for (const entry of entries) {
        const previousName = namesByUsn.get(entry.usn)
        if (previousName && previousName !== entry.fullName) {
          throw new ConnectRequestError(`The import contains conflicting names for USN ${entry.usn}.`)
        }
        namesByUsn.set(entry.usn, entry.fullName)
      }
      const uniqueEntries = [...new Map(entries.map((entry) => [entry.usn, entry])).values()]
      const values = uniqueEntries.map(
        ({ usn, fullName }) => Prisma.sql`(${usn}, ${fullName}, true, CURRENT_TIMESTAMP)`
      )

      await prisma.$transaction(async (tx) => {
        if (replace) await tx.usnRosterEntry.updateMany({ data: { isActive: false } })
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "connect_usn_roster" ("usn", "full_name", "is_active", "imported_at")
          VALUES ${Prisma.join(values)}
          ON CONFLICT ("usn") DO UPDATE
          SET "full_name" = EXCLUDED."full_name",
              "is_active" = true,
              "imported_at" = CURRENT_TIMESTAMP
        `)

        const profiles = await tx.memberProfile.findMany({
          where: { usn: { in: uniqueEntries.map((entry) => entry.usn) } },
          select: { authUserId: true, usn: true, fullName: true },
        })
        for (const profile of profiles) {
          const rosterName = namesByUsn.get(profile.usn)
          if (!rosterName || profile.fullName === rosterName) continue

          const identityChanged =
            normalizePersonName(profile.fullName) !== normalizePersonName(rosterName)
          await tx.memberProfile.update({
            where: { authUserId: profile.authUserId },
            data: {
              fullName: rosterName,
              ...(identityChanged
                ? {
                    approvalStatus: 'PENDING',
                    reviewedById: null,
                    reviewedAt: null,
                    reviewNote: 'Official roster name changed; re-review required.',
                  }
                : {}),
            },
          })
        }
        if (replace) {
          await tx.memberProfile.updateMany({
            where: { usn: { notIn: uniqueEntries.map((entry) => entry.usn) } },
            data: {
              approvalStatus: 'SUSPENDED',
              reviewedById: admin.id,
              reviewedAt: new Date(),
              reviewNote: 'USN is no longer present in the current official roster.',
            },
          })
        }

        await writeRosterAudit(
          tx,
          admin.id,
          req,
          'IMPORT',
          `${replace ? 'Replaced' : 'Updated'} ${uniqueEntries.length} roster entries.`
        )
      })

      return NextResponse.json({
        success: true,
        processed: uniqueEntries.length,
        replaced: replace,
      })
    }

    const usn = normalizeUsn(body.usn)
    const fullName = requiredString(body.fullName, 'fullName', 120)
    await prisma.$transaction(async (tx) => {
      await tx.usnRosterEntry.upsert({
        where: { usn },
        create: { usn, fullName, isActive: true },
        update: { fullName, isActive: true, importedAt: new Date() },
      })
      await syncProfileName(tx, usn, fullName)
      await writeRosterAudit(tx, admin.id, req, 'CREATE', `Created or reactivated roster entry ${usn}.`)
    })

    return NextResponse.json({ success: true, entry: { usn, fullName, isActive: true } }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A roster entry with that USN already exists.' }, { status: 409 })
    }
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect roster create/import failed:', error)
    return NextResponse.json({ error: 'Failed to create or import roster entries.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!requireSuperAdmin(admin.role)) {
      return NextResponse.json({ error: 'Only a super administrator may manage the roster.' }, { status: 403 })
    }

    const body = await readJsonObject(req)
    const oldUsn = normalizeUsn(body.usn)
    const newUsn = body.newUsn === undefined ? oldUsn : normalizeUsn(body.newUsn)
    const fullName = requiredString(body.fullName, 'fullName', 120)

    await prisma.$transaction(async (tx) => {
      const existing = await tx.usnRosterEntry.findUnique({ where: { usn: oldUsn } })
      if (!existing?.isActive) {
        throw new ConnectRequestError('Active roster entry not found.', 404)
      }

      const existingProfile = await tx.memberProfile.findUnique({
        where: { usn: oldUsn },
        select: { authUserId: true },
      })
      if (newUsn !== oldUsn) {
        const targetEntry = await tx.usnRosterEntry.findUnique({ where: { usn: newUsn } })
        const targetProfile = await tx.memberProfile.findUnique({ where: { usn: newUsn } })
        if ((targetEntry?.isActive && newUsn !== oldUsn) || targetProfile) {
          throw new ConnectRequestError('The new USN is already in use.', 409)
        }

        if (existingProfile) {
          await tx.usnClaim.upsert({
            where: { usn: newUsn },
            create: { usn: newUsn },
            update: {},
          })
          await tx.memberProfile.update({
            where: { authUserId: existingProfile.authUserId },
            data: {
              usn: newUsn,
              fullName,
              approvalStatus: 'PENDING',
              reviewedById: null,
              reviewedAt: null,
              reviewNote: 'USN changed by an administrator; re-review required.',
            },
          })
        }

        await tx.usnRosterEntry.update({
          where: { usn: oldUsn },
          data: { isActive: false, importedAt: new Date() },
        })
        await tx.usnRosterEntry.upsert({
          where: { usn: newUsn },
          create: { usn: newUsn, fullName, isActive: true },
          update: { fullName, isActive: true, importedAt: new Date() },
        })
      } else {
        await tx.usnRosterEntry.update({
          where: { usn: oldUsn },
          data: { fullName, importedAt: new Date() },
        })
        await syncProfileName(tx, oldUsn, fullName)
      }

      await writeRosterAudit(
        tx,
        admin.id,
        req,
        'UPDATE',
        `Updated roster entry ${oldUsn}${newUsn !== oldUsn ? ` to ${newUsn}` : ''}.`
      )
    })

    return NextResponse.json({ success: true, entry: { usn: newUsn, fullName, isActive: true } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'The new USN is already in use.' }, { status: 409 })
    }
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect roster update failed:', error)
    return NextResponse.json({ error: 'Failed to update the roster entry.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (!requireSuperAdmin(admin.role)) {
      return NextResponse.json({ error: 'Only a super administrator may manage the roster.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const usn = normalizeUsn(searchParams.get('usn'))

    const entry = await prisma.$transaction(async (tx) => {
      const current = await tx.usnRosterEntry.findUnique({ where: { usn } })
      if (!current || !current.isActive) {
        throw new ConnectRequestError('Active roster entry not found.', 404)
      }
      const updated = await tx.usnRosterEntry.update({
        where: { usn },
        data: { isActive: false, importedAt: new Date() },
        select: { usn: true, fullName: true, isActive: true },
      })
      await tx.memberProfile.updateMany({
        where: { usn },
        data: {
          approvalStatus: 'SUSPENDED',
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNote: 'USN was removed from the official roster.',
        },
      })
      await writeRosterAudit(tx, admin.id, req, 'DELETE', `Deactivated roster entry ${usn}.`)
      return updated
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect roster delete failed:', error)
    return NextResponse.json({ error: 'Failed to remove the roster entry.' }, { status: 500 })
  }
}
