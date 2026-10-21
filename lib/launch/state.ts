import { prisma } from '@/lib/prisma'
import type { PublicLaunchState } from './types'
import { ANIMATION_SECONDS, COUNTDOWN_SECONDS } from './types'

const SINGLETON_ID = 1

type InternalLaunchState = {
  id: number
  status: 'NORMAL' | 'STAY_TUNED' | 'COUNTDOWN_RUNNING' | 'ANIMATION' | 'LAUNCHED'
  countdownStartedAt: Date | null
  countdownEndsAt: Date | null
  animationStartedAt: Date | null
  animationEndsAt: Date | null
  launchedAt: Date | null
  version: bigint
  updatedAt: Date
  updatedByAdminId: string | null
}

function toPublicState(row: InternalLaunchState): PublicLaunchState {
  return {
    status: row.status,
    countdownStartedAt: row.countdownStartedAt ? row.countdownStartedAt.toISOString() : null,
    countdownEndsAt: row.countdownEndsAt ? row.countdownEndsAt.toISOString() : null,
    animationStartedAt: row.animationStartedAt ? row.animationStartedAt.toISOString() : null,
    animationEndsAt: row.animationEndsAt ? row.animationEndsAt.toISOString() : null,
    launchedAt: row.launchedAt ? row.launchedAt.toISOString() : null,
    version: row.version.toString(),
    updatedAt: row.updatedAt.toISOString(),
    serverTime: new Date().toISOString(),
  }
}

function toSafeAdminUuid(id?: string | null): string | null {
  if (!id) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id) ? id : null
}

// In-memory cache to keep read latency <1ms and prevent saturating PgBouncer connection pools
let cachedInternalState: InternalLaunchState | null = null
let cacheExpiresAt = 0

export function invalidateLaunchCache() {
  cachedInternalState = null
  cacheExpiresAt = 0
}

export async function getOrCreateLaunchState(): Promise<InternalLaunchState> {
  // Use findUnique first for fast indexed read without acquiring write locks
  let row = await prisma.websiteLaunchState.findUnique({
    where: { id: SINGLETON_ID },
  })

  if (!row) {
    try {
      row = await prisma.websiteLaunchState.create({
        data: {
          id: SINGLETON_ID,
          status: 'NORMAL',
          version: BigInt(0),
        },
      })
    } catch {
      row = await prisma.websiteLaunchState.findUnique({
        where: { id: SINGLETON_ID },
      })
    }
  }

  return row as InternalLaunchState
}

export async function reconcileLaunchStateNow(): Promise<InternalLaunchState> {
  const now = new Date()
  const nowMs = now.getTime()

  // Return cached state if valid and no timed transition is due
  if (cachedInternalState && nowMs < cacheExpiresAt) {
    const isCountdownDue =
      cachedInternalState.status === 'COUNTDOWN_RUNNING' &&
      cachedInternalState.countdownEndsAt &&
      cachedInternalState.countdownEndsAt.getTime() <= nowMs

    const isAnimationDue =
      cachedInternalState.status === 'ANIMATION' &&
      cachedInternalState.animationEndsAt &&
      cachedInternalState.animationEndsAt.getTime() <= nowMs

    if (!isCountdownDue && !isAnimationDue) {
      return cachedInternalState
    }
  }

  const current = await getOrCreateLaunchState()

  // Auto-advance COUNTDOWN_RUNNING -> ANIMATION when countdown period expires
  if (current.status === 'COUNTDOWN_RUNNING' && current.countdownEndsAt && current.countdownEndsAt <= now) {
    const animationStartedAt = current.countdownEndsAt
    const animationEndsAt = new Date(animationStartedAt.getTime() + ANIMATION_SECONDS * 1000)

    try {
      const updated = await prisma.websiteLaunchState.update({
        where: { id: SINGLETON_ID },
        data: {
          status: 'ANIMATION',
          animationStartedAt,
          animationEndsAt,
          version: { increment: 1 },
        },
      })

      cachedInternalState = updated as InternalLaunchState
      cacheExpiresAt = nowMs + 1000
      return cachedInternalState
    } catch {
      cachedInternalState = current
      cacheExpiresAt = nowMs + 1000
      return current
    }
  }

  // Auto-advance ANIMATION -> LAUNCHED when animation period expires
  if (current.status === 'ANIMATION' && current.animationEndsAt && current.animationEndsAt <= now) {
    try {
      const updated = await prisma.websiteLaunchState.update({
        where: { id: SINGLETON_ID },
        data: {
          status: 'LAUNCHED',
          launchedAt: current.animationEndsAt,
          version: { increment: 1 },
        },
      })

      cachedInternalState = updated as InternalLaunchState
      cacheExpiresAt = nowMs + 1000
      return cachedInternalState
    } catch {
      cachedInternalState = current
      cacheExpiresAt = nowMs + 1000
      return current
    }
  }

  cachedInternalState = current
  cacheExpiresAt = nowMs + 1000
  return current
}

export async function getPublicLaunchState(): Promise<PublicLaunchState> {
  const row = await reconcileLaunchStateNow()
  return toPublicState(row)
}

export async function enableCountdown(adminId?: string | null): Promise<PublicLaunchState> {
  invalidateLaunchCache()
  const row = await reconcileLaunchStateNow()

  if (row.status === 'COUNTDOWN_RUNNING' || row.status === 'ANIMATION') {
    return toPublicState(row)
  }

  const updated = await prisma.websiteLaunchState.update({
    where: { id: SINGLETON_ID },
    data: {
      status: 'STAY_TUNED',
      countdownStartedAt: null,
      countdownEndsAt: null,
      animationStartedAt: null,
      animationEndsAt: null,
      launchedAt: null,
      updatedByAdminId: toSafeAdminUuid(adminId),
      version: { increment: 1 },
    },
  })

  cachedInternalState = updated as InternalLaunchState
  cacheExpiresAt = Date.now() + 1000
  return toPublicState(cachedInternalState)
}

export async function startLaunchCountdown(adminId?: string | null): Promise<{ state: PublicLaunchState; alreadyRunning: boolean }> {
  invalidateLaunchCache()
  const now = new Date()
  const current = await getOrCreateLaunchState()

  if (current.status === 'COUNTDOWN_RUNNING') {
    if (current.countdownEndsAt && current.countdownEndsAt > now) {
      cachedInternalState = current
      cacheExpiresAt = Date.now() + 1000
      return { state: toPublicState(current), alreadyRunning: true }
    }
  }

  const countdownStartedAt = now
  const countdownEndsAt = new Date(now.getTime() + COUNTDOWN_SECONDS * 1000)

  const started = await prisma.websiteLaunchState.update({
    where: { id: SINGLETON_ID },
    data: {
      status: 'COUNTDOWN_RUNNING',
      countdownStartedAt,
      countdownEndsAt,
      animationStartedAt: null,
      animationEndsAt: null,
      launchedAt: null,
      updatedByAdminId: toSafeAdminUuid(adminId),
      version: { increment: 1 },
    },
  })

  cachedInternalState = started as InternalLaunchState
  cacheExpiresAt = Date.now() + 1000

  return {
    state: toPublicState(cachedInternalState),
    alreadyRunning: false,
  }
}

export async function resetLaunch(adminId?: string | null): Promise<PublicLaunchState> {
  invalidateLaunchCache()
  const updated = await prisma.websiteLaunchState.update({
    where: { id: SINGLETON_ID },
    data: {
      status: 'NORMAL',
      countdownStartedAt: null,
      countdownEndsAt: null,
      animationStartedAt: null,
      animationEndsAt: null,
      launchedAt: null,
      updatedByAdminId: toSafeAdminUuid(adminId),
      version: { increment: 1 },
    },
  })

  cachedInternalState = updated as InternalLaunchState
  cacheExpiresAt = Date.now() + 1000
  return toPublicState(cachedInternalState)
}
