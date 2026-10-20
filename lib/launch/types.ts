export type LaunchStatus = 'NORMAL' | 'STAY_TUNED' | 'COUNTDOWN_RUNNING' | 'ANIMATION' | 'LAUNCHED'

export type PublicLaunchState = {
  status: LaunchStatus
  countdownStartedAt: string | null
  countdownEndsAt: string | null
  animationStartedAt: string | null
  animationEndsAt: string | null
  launchedAt: string | null
  version: string
  updatedAt: string
  serverTime?: string
}

export const COUNTDOWN_SECONDS = 10
export const ANIMATION_SECONDS = 6
