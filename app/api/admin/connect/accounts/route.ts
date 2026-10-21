import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createConnectSupabaseAdminClient } from '@/lib/connect/supabase-admin'
import { getAuthenticatedConnectAdmin, isSameOriginRequest } from '@/lib/connect/auth'
import {
  ConnectRequestError,
  isRecord,
  readJsonObject,
  requestErrorResponse,
  uuidString,
} from '@/lib/connect/validation'

const PAGE_SIZE = 1000

function parsePage(value: string | null, name: string, max: number) {
  if (value === null) return 1
  if (!/^\d+$/.test(value)) throw new ConnectRequestError(`${name} must be a positive integer.`)
  const number = Number(value)
  if (number < 1 || number > max) {
    throw new ConnectRequestError(`${name} must be between 1 and ${max}.`)
  }
  return number
}

function isProfileStatus(value: unknown): value is 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  return value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED' || value === 'SUSPENDED'
}

function isVisibility(value: unknown): value is 'PUBLIC' | 'PRIVATE' {
  return value === 'PUBLIC' || value === 'PRIVATE'
}

async function listAllAuthUsers() {
  const supabase = createConnectSupabaseAdminClient()
  const users = []

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error(`Unable to list Connect accounts: ${error.message}`)
    users.push(...data.users)
    if (data.users.length < PAGE_SIZE) break
    if (page === 100) {
      throw new Error('Connect account listing exceeded the supported page limit.')
    }
  }

  return users
}

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'ALL'
    if (!['ALL', 'ACTIVE', 'DISABLED', 'UNCONFIRMED'].includes(status)) {
      throw new ConnectRequestError('Invalid Connect account status filter.')
    }
    const page = parsePage(searchParams.get('page'), 'page', 1_000_000)
    const limit = parsePage(searchParams.get('limit'), 'limit', 100)
    const query = searchParams.get('q')?.trim().toLocaleLowerCase('en') ?? ''
    if (query.length > 100) throw new ConnectRequestError('q cannot exceed 100 characters.')

    const users = await listAllAuthUsers()
    const profiles = await prisma.memberProfile.findMany({
      where: { authUserId: { in: users.map((user) => user.id) } },
      select: { authUserId: true, fullName: true, slug: true, approvalStatus: true },
    })
    const registrations = await prisma.connectRegistration.findMany({
      where: {
        OR: [
          { authUserId: { in: users.map((user) => user.id) } },
          { email: { in: users.flatMap((user) => user.email ? [user.email.toLowerCase()] : []) } },
        ],
      },
      select: { authUserId: true, email: true, usn: true, createdAt: true, emailConfirmedAt: true },
    })
    const profileByUserId = new Map(profiles.map((profile) => [profile.authUserId, profile]))
    const registrationByUserId = new Map<string, (typeof registrations)[number]>()
    const registrationByEmail = new Map<string, (typeof registrations)[number]>()
    for (const registration of registrations) {
      if (registration.authUserId) registrationByUserId.set(registration.authUserId, registration)
      registrationByEmail.set(registration.email.toLowerCase(), registration)
    }
    const accounts = users
      .filter((user) =>
        registrationByUserId.has(user.id) ||
        registrationByEmail.has(user.email?.toLowerCase() ?? '') ||
        typeof user.user_metadata?.connect_usn === 'string' ||
        profileByUserId.has(user.id)
      )
      .map((user) => {
        const profile = profileByUserId.get(user.id) ?? null
        const registration = registrationByUserId.get(user.id)
          ?? registrationByEmail.get(user.email?.toLowerCase() ?? '')
        const usn = registration?.usn
          ?? (typeof user.user_metadata?.connect_usn === 'string' ? user.user_metadata.connect_usn : null)
        const disabled = user.app_metadata?.connect_disabled === true
        return {
          id: user.id,
          email: registration?.email ?? user.email ?? '',
          usn,
          createdAt: registration?.createdAt.toISOString() ?? user.created_at,
          emailConfirmedAt: user.email_confirmed_at ?? registration?.emailConfirmedAt?.toISOString() ?? null,
          disabled,
          profile,
        }
      })
      .filter((account) => {
        if (status === 'ACTIVE' && (account.disabled || !account.emailConfirmedAt)) return false
        if (status === 'DISABLED' && !account.disabled) return false
        if (status === 'UNCONFIRMED' && (account.emailConfirmedAt || account.disabled)) return false
        if (!query) return true
        return [
          account.email,
          account.usn ?? '',
          account.profile?.fullName ?? '',
          account.id,
        ].some((value) => value.toLocaleLowerCase('en').includes(query))
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = accounts.length
    const start = (page - 1) * limit
    return NextResponse.json({
      accounts: accounts.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      canManageAccounts: admin.role === 'SUPER_ADMIN',
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect account list failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
          ? error.message
          : 'Failed to load Connect accounts.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const admin = await getAuthenticatedConnectAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a super administrator may disable Connect accounts.' }, { status: 403 })
    }

    const body = await readJsonObject(req)
    const userId = uuidString(body.userId, 'userId')
    if (body.status !== 'ACTIVE' && body.status !== 'DISABLED') {
      throw new ConnectRequestError('status must be ACTIVE or DISABLED.')
    }

    const supabase = createConnectSupabaseAdminClient()
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data.user) {
      if (error) console.error('Connect account lookup failed:', error.message)
      return NextResponse.json({ error: 'Connect account not found.' }, { status: 404 })
    }

    const user = data.user
    const profile = await prisma.memberProfile.findUnique({
      where: { authUserId: userId },
      select: { approvalStatus: true, visibility: true },
    })
    if (typeof user.user_metadata?.connect_usn !== 'string' && !profile) {
      return NextResponse.json({ error: 'Connect account not found.' }, { status: 404 })
    }

    const currentlyDisabled = user.app_metadata?.connect_disabled === true
    const shouldDisable = body.status === 'DISABLED'
    if (currentlyDisabled === shouldDisable) {
      return NextResponse.json({ success: true, status: body.status })
    }

    const previousMetadata = { ...user.app_metadata }
    const nextMetadata = { ...previousMetadata }

    if (shouldDisable) {
      nextMetadata.connect_disabled = true
      if (profile) {
        nextMetadata.connect_profile_state = {
          approvalStatus: profile.approvalStatus,
          visibility: profile.visibility,
        }
      }
    } else {
      delete nextMetadata.connect_disabled
      delete nextMetadata.connect_profile_state
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: nextMetadata,
    })
    if (updateError) {
      console.error('Connect account status update failed:', updateError.message)
      return NextResponse.json({ error: 'Unable to update this Connect account.' }, { status: 502 })
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (profile) {
          if (shouldDisable) {
            await tx.memberProfile.update({
              where: { authUserId: userId },
              data: { approvalStatus: 'SUSPENDED', visibility: 'PRIVATE' },
            })
          } else {
            const savedState = isRecord(user.app_metadata?.connect_profile_state)
              ? user.app_metadata.connect_profile_state
              : null
            await tx.memberProfile.update({
              where: { authUserId: userId },
              data: {
                approvalStatus: isProfileStatus(savedState?.approvalStatus)
                  ? savedState.approvalStatus
                  : 'PENDING',
                visibility: isVisibility(savedState?.visibility)
                  ? savedState.visibility
                  : 'PRIVATE',
              },
            })
          }
        }
        await tx.auditLog.create({
          data: {
            action: shouldDisable ? 'DISABLE' : 'ENABLE',
            entity: 'Connect account',
            entityId: userId,
            details: `Connect account ${shouldDisable ? 'disabled' : 're-enabled'} by ${admin.email}.`,
            adminId: admin.id,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          },
        })
      })
    } catch (databaseError) {
      const { error: rollbackError } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: previousMetadata,
      })
      if (rollbackError) {
        console.error('Connect account rollback failed:', rollbackError.message)
      }
      throw databaseError
    }

    return NextResponse.json({ success: true, status: body.status })
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect account status update failed:', error)
    return NextResponse.json({ error: 'Failed to update the Connect account.' }, { status: 500 })
  }
}
