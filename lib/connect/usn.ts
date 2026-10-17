import { Prisma } from '@/generated/prisma/client'
import { createHmac } from 'node:crypto'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { CONNECT_SUPPORT_EMAIL, normalizeSignupUsn } from '@/lib/connect/validation'

const authAttemptLimit = 10
const windowDurationMs = 15 * 60 * 1000

export type UsnVerification =
  | { valid: true; usn: string; fullName: string }
  | { valid: false; status: 404 | 409; error: string }

function getClientIp(req: Request): string {
  const ip = req.headers.get('x-real-ip')?.trim() ||
    (process.env.NODE_ENV !== 'production' ? 'local-development' : '')
  if (!ip) throw new Error('Trusted client IP header is unavailable for Connect auth rate limiting.')
  return ip
}

function getIpHash(ip: string): string {
  const secret = env.CONNECT_LOOKUP_HMAC_SECRET
  if (secret.length < 32) {
    throw new Error('CONNECT_LOOKUP_HMAC_SECRET must be configured with at least 32 characters.')
  }
  return createHmac('sha256', secret).update(`usn:${ip}`).digest('hex')
}

export async function consumeConnectUsnLookupAttempt(req: Request): Promise<{
  allowed: boolean
  retryAfter?: number
}> {
  const ipHash = getIpHash(getClientIp(req))
  const [limitState] = await prisma.$queryRaw<
    Array<{ attempts: number; window_started_at: Date }>
  >(Prisma.sql`
    INSERT INTO "connect_auth_rate_limits"
      ("ip_hash", "window_started_at", "attempts", "updated_at")
    VALUES (${ipHash}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("ip_hash") DO UPDATE
    SET
      "attempts" = CASE
        WHEN "connect_auth_rate_limits"."window_started_at"
          <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        THEN 1
        ELSE "connect_auth_rate_limits"."attempts" + 1
      END,
      "window_started_at" = CASE
        WHEN "connect_auth_rate_limits"."window_started_at"
          <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        THEN CURRENT_TIMESTAMP
        ELSE "connect_auth_rate_limits"."window_started_at"
      END,
      "updated_at" = CURRENT_TIMESTAMP
    RETURNING "attempts", "window_started_at"
  `)

  if (limitState.attempts === 1) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "connect_auth_rate_limits"
      WHERE "updated_at" < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `)
  }

  if (limitState.attempts <= authAttemptLimit) return { allowed: true }
  const windowEndsAt = limitState.window_started_at.getTime() + windowDurationMs
  return {
    allowed: false,
    retryAfter: Math.max(1, Math.ceil((windowEndsAt - Date.now()) / 1000)),
  }
}

export async function verifySignupUsn(
  usnInput: unknown,
  authUserId?: string
): Promise<UsnVerification> {
  const usn = normalizeSignupUsn(usnInput)
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { usn },
    select: { authUserId: true },
  })
  if (existingProfile) {
    return {
      valid: false,
      status: 409,
      error: `This USN is already linked to a Connect profile. Contact ${CONNECT_SUPPORT_EMAIL} if you think this is a mistake.`,
    }
  }

  const existingRegistration = await prisma.connectRegistration.findUnique({
    where: { usn },
    select: { authUserId: true },
  })
  if (existingRegistration && existingRegistration.authUserId !== authUserId) {
    return {
      valid: false,
      status: 409,
      error: `This USN is already being used for a Connect account. Contact ${CONNECT_SUPPORT_EMAIL} if you need help.`,
    }
  }

  const entry = await prisma.usnRosterEntry.findFirst({
    where: { usn, isActive: true },
    select: { fullName: true },
  })
  if (!entry) {
    return {
      valid: false,
      status: 404,
      error: `Enter a valid USN or contact ${CONNECT_SUPPORT_EMAIL} if you think this is a mistake.`,
    }
  }

  return { valid: true, usn, fullName: entry.fullName }
}
