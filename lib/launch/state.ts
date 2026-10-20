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

export async function getOrCreateLaunchState(): Promise<InternalLaunchState> {
  const row = await prisma.websiteLaunchState.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      status: 'NORMAL',
      version: BigInt(0),
    },
  })

  return row as InternalLaunchState
}

export async function reconcileLaunchStateNow(): Promise<InternalLaunchState> {
  const now = new Date()
  const current = await getOrCreateLaunchState()

  if (current.status === 'COUNTDOWN_RUNNING' && current.countdownEndsAt && current.countdownEndsAt <= now) {
    const animationStartedAt = current.countdownEndsAt
    const animationEndsAt = new Date(animationStartedAt.getTime() + ANIMATION_SECONDS * 1000)

    try {
      const updated = await prisma.websiteLaunchState.update({
        where: { id: SINGLETON_ID, version: current.version },
        data: {
          status: 'ANIMATION',
          animationStartedAt,
          animationEndsAt,
          version: { increment: 1 },
        },
      })

      return updated as InternalLaunchState
    } catch {
      return await getOrCreateLaunchState()
    }
  }

  if (current.status === 'ANIMATION' && current.animationEndsAt && current.animationEndsAt <= now) {
    try {
      const updated = await prisma.websiteLaunchState.update({
        where: { id: SINGLETON_ID, version: current.version },
        data: {
          status: 'LAUNCHED',
          launchedAt: current.animationEndsAt,
          version: { increment: 1 },
        },
      })

      return updated as InternalLaunchState
    } catch {
      return await getOrCreateLaunchState()
    }
  }

  return current
}

export async function getPublicLaunchState(): Promise<PublicLaunchState> {
  const row = await reconcileLaunchStateNow()
  return toPublicState(row)
}

export async function enableCountdown(adminId?: string | null): Promise<PublicLaunchState> {
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

  return toPublicState(updated as InternalLaunchState)
}

export async function startLaunchCountdown(adminId: string): Promise<{ state: PublicLaunchState; alreadyRunning: boolean }> {
  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const current = (await tx.websiteLaunchState.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: {
        id: SINGLETON_ID,
        status: 'NORMAL',
        version: BigInt(0),
      },
    })) as InternalLaunchState

    if (current.status === 'COUNTDOWN_RUNNING') {
      if (!current.countdownEndsAt || current.countdownEndsAt <= now) {
        const animationStartedAt = current.countdownEndsAt ?? now
        const animationEndsAt = new Date(animationStartedAt.getTime() + ANIMATION_SECONDS * 1000)
        const transitioned = (await tx.websiteLaunchState.update({
          where: { id: SINGLETON_ID },
          data: {
            status: 'ANIMATION',
            animationStartedAt,
            animationEndsAt,
            version: { increment: 1 },
          },
        })) as InternalLaunchState
        return { row: transitioned, alreadyRunning: false }
      }

      return { row: current, alreadyRunning: true }
    }

    if (current.status === 'ANIMATION') {
      if (current.animationEndsAt && current.animationEndsAt > now) {
        return { row: current, alreadyRunning: true }
      }

      const launched = (await tx.websiteLaunchState.update({
        where: { id: SINGLETON_ID },
        data: {
          status: 'LAUNCHED',
          launchedAt: current.animationEndsAt ?? now,
          version: { increment: 1 },
        },
      })) as InternalLaunchState

      return { row: launched, alreadyRunning: false }
    }

    const countdownStartedAt = now
    const countdownEndsAt = new Date(now.getTime() + COUNTDOWN_SECONDS * 1000)

    const started = (await tx.websiteLaunchState.update({
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
    })) as InternalLaunchState

    return { row: started, alreadyRunning: false }
  })

  return {
    state: toPublicState(result.row),
    alreadyRunning: result.alreadyRunning,
  }
}

export async function resetLaunch(adminId?: string | null): Promise<PublicLaunchState> {
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

  return toPublicState(updated as InternalLaunchState)
}
