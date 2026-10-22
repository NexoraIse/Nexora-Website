'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAudio } from '@/components/AudioProvider'
import { ANIMATION_SECONDS, COUNTDOWN_SECONDS, type PublicLaunchState } from '@/lib/launch/types'
import { BOOT_LOG_LINES, CORE_CONFIG, LaunchCoreScene, easeOutExpo } from './LaunchCoreScene'
import type { LaunchCoreVisual } from './LaunchCoreScene'
import './LaunchOverlay.css'

const TEXT = {
  standby: 'TRANSMISSION STANDBY',
  launch: 'NEXORA',
} as const

const TIMING = {
  bootTypeMs: 2100,
  stateTickMs: 80,
  impactMs: 820,
  silenceEnd: CORE_CONFIG.launch.silenceEnd,
  blastEnd: CORE_CONFIG.launch.blastEnd,
  dissolveMs: 850,
  normalDissolveMs: 250,
  digitMs: 760,
  shakeMs: 980,
  logoPulseMs: 4300,
  logoTransitionMs: 220,
} as const

const VOLUME = {
  drone: 0.024,
  riser: 0.045,
  impact: 0.13,
  launchNote: 0.055,
} as const

const LAUNCH_SCORE = [
  { progress: 0.18, notes: [146.83, 293.66, 440] },
  { progress: 0.3, notes: [220, 329.63, 440] },
  { progress: 0.42, notes: [293.66, 440, 587.33] },
  { progress: 0.54, notes: [369.99, 440, 587.33] },
  { progress: 0.66, notes: [440, 587.33, 659.25] },
  { progress: 0.77, notes: [293.66, 369.99, 440, 587.33] },
  { progress: 0.84, notes: [440, 587.33, 739.99, 880] },
] as const

type PreviewStatus = 'STAY_TUNED' | 'COUNTDOWN_RUNNING' | 'ANIMATION'
const PREVIEW_STATUSES: readonly PreviewStatus[] = ['STAY_TUNED', 'COUNTDOWN_RUNNING', 'ANIMATION']

type LaunchOverlayProps = {
  state: PublicLaunchState
  onOverlayDone: () => void
}

type LaunchStyle = CSSProperties & {
  '--boot-type-duration': string
  '--dissolve-duration': string
  '--digit-duration': string
  '--shake-duration': string
  '--logo-pulse-duration': string
  '--logo-transition-duration': string
  '--logo-opacity'?: number
}

type AudioRuntime = {
  context: AudioContext
  drone: OscillatorNode
  droneGain: GainNode
  riser: OscillatorNode
  riserGain: GainNode
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function parseTime(value: string | null | undefined) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getPreviewState() {
  if (process.env.NODE_ENV !== 'development') return null
  const params = new URLSearchParams(window.location.search)
  if (params.get('followState') === '1') return null
  const requested = params.get('launchPreview')
  if (!PREVIEW_STATUSES.includes(requested as PreviewStatus)) return null
  return {
    status: requested as PreviewStatus,
    elapsed: clamp(Number(params.get('elapsed') || 0), 0, requested === 'COUNTDOWN_RUNNING' ? 10 : ANIMATION_SECONDS),
  }
}

function makePreviewState(
  status: PreviewStatus,
  elapsed: number,
  fallback: PublicLaunchState,
): PublicLaunchState {
  const now = Date.now()
  const serverTime = new Date(now).toISOString()
  if (status === 'STAY_TUNED') {
    return { ...fallback, status, serverTime }
  }
  if (status === 'COUNTDOWN_RUNNING') {
    const countdownStartedAt = new Date(now - elapsed * 1000).toISOString()
    const countdownEndsAt = new Date(now + (10 - elapsed) * 1000).toISOString()
    return { ...fallback, status, countdownStartedAt, countdownEndsAt, serverTime }
  }
  const animationStartedAt = new Date(now - elapsed * 1000).toISOString()
  const animationEndsAt = new Date(now + (ANIMATION_SECONDS - elapsed) * 1000).toISOString()
  return { ...fallback, status, animationStartedAt, animationEndsAt, serverTime }
}

function playImpact(runtime: AudioRuntime) {
  const { context } = runtime
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * TIMING.impactMs / 1000), context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length) ** 2
  }

  const noise = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  noise.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.value = 520
  gain.gain.setValueAtTime(VOLUME.impact, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + TIMING.impactMs / 1000)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  noise.start()
  noise.stop(context.currentTime + TIMING.impactMs / 1000)
}

function playLaunchChord(runtime: AudioRuntime, notes: readonly number[]) {
  const { context } = runtime
  const startTime = context.currentTime
  const duration = 0.78
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.001, startTime)
  gain.gain.linearRampToValueAtTime(VOLUME.launchNote, startTime + 0.035)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  gain.connect(context.destination)
  let endedOscillators = 0

  for (const frequency of notes) {
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startTime)
    oscillator.connect(gain)
    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
    oscillator.onended = () => {
      oscillator.disconnect()
      endedOscillators += 1
      if (endedOscillators === notes.length) gain.disconnect()
    }
  }
}

function LaunchOverlay({ state, onOverlayDone }: LaunchOverlayProps) {
  const [now, setNow] = useState(() => Date.now())
  const [serverOffset, setServerOffset] = useState<number | null>(null)
  const [previewState, setPreviewState] = useState<PublicLaunchState | null>(null)
  const [webglUnavailable, setWebglUnavailable] = useState(false)
  const { setLaunchAudioActive } = useAudio()
  const initialStateRef = useRef(state)
  const audioRef = useRef<AudioRuntime | null>(null)
  const visualRef = useRef<LaunchCoreVisual>({
    status: state.status === 'LAUNCHED' || state.status === 'NORMAL' ? 'ANIMATION' : state.status,
    countdown: null,
    countdownProgress: 0,
    launchProgress: 0,
  })
  const previousStatusRef = useRef(state.status)
  const launchImpactPlayedRef = useRef(false)
  const lastLaunchProgressRef = useRef<number | null>(null)
  const activeState = previewState ?? state
  const preview = previewState !== null
  const serverTime = parseTime(activeState.serverTime)
  const serverNow = serverTime === null
    ? null
    : serverOffset === null ? serverTime : now + serverOffset
  const countdownEnd = parseTime(activeState.countdownEndsAt)
  const animationStart = parseTime(activeState.animationStartedAt)
  const animationEnd = parseTime(activeState.animationEndsAt)
  const countdownRemaining = countdownEnd !== null && serverNow !== null
    ? Math.max(0, (countdownEnd - serverNow) / 1000)
    : null
  const countdown = countdownRemaining === null ? null : Math.ceil(countdownRemaining)
  const countdownProgress = activeState.status === 'COUNTDOWN_RUNNING' && countdownRemaining !== null
    ? clamp((COUNTDOWN_SECONDS - countdownRemaining) / COUNTDOWN_SECONDS)
    : activeState.status === 'ANIMATION' || activeState.status === 'LAUNCHED' ? 1 : 0

  const launchProgress = useMemo(() => {
    if (serverNow === null || animationStart === null) return 0
    const end = animationEnd ?? animationStart + ANIMATION_SECONDS * 1000
    if (end <= animationStart) return 1
    return clamp((serverNow - animationStart) / (end - animationStart))
  }, [animationEnd, animationStart, serverNow])

  const visual = useMemo<LaunchCoreVisual>(() => ({
    status: activeState.status === 'NORMAL' ? 'STAY_TUNED' :
      activeState.status === 'LAUNCHED' ? 'ANIMATION' : activeState.status,
    countdown,
    countdownProgress,
    launchProgress,
  }), [activeState.status, countdown, countdownProgress, launchProgress])

  useEffect(() => {
    visualRef.current = visual
  }, [visual])
  const systemProgress = activeState.status === 'COUNTDOWN_RUNNING'
    ? Math.round(countdownProgress * 100)
    : activeState.status === 'STAY_TUNED' ? 100 : Math.round(launchProgress * 100)
  const shownBootLines = BOOT_LOG_LINES.filter(({ progress }) =>
    activeState.status === 'STAY_TUNED' ? progress === 0 : countdownProgress >= progress,
  )

  useEffect(() => {
    const preview = getPreviewState()
    if (preview) {
      setPreviewState(makePreviewState(preview.status, preview.elapsed, initialStateRef.current))
    }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    setLaunchAudioActive(true)
    return () => setLaunchAudioActive(false)
  }, [setLaunchAudioActive])

  useEffect(() => {
    let runtime: AudioRuntime | null = null
    try {
      if (window.AudioContext) {
        const context = new window.AudioContext()
        const drone = context.createOscillator()
        const droneGain = context.createGain()
        const riser = context.createOscillator()
        const riserGain = context.createGain()

        drone.type = 'sine'
        drone.frequency.value = 39
        droneGain.gain.value = VOLUME.drone
        riser.type = 'sawtooth'
        riser.frequency.value = 54
        riserGain.gain.value = 0.001
        drone.connect(droneGain)
        droneGain.connect(context.destination)
        riser.connect(riserGain)
        riserGain.connect(context.destination)
        drone.start()
        riser.start()
        runtime = { context, drone, droneGain, riser, riserGain }
        audioRef.current = runtime
        void context.resume().catch(() => {
          // The visual sequence continues without audio when autoplay is blocked.
        })
      }
    } catch (error) {
      console.error('Launch audio could not be initialized:', error)
    }

    return () => {
      if (!runtime) return
      runtime.drone.stop()
      runtime.riser.stop()
      void runtime.context.close()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
      const runtime = audioRef.current
      if (!runtime) return

      const current = visualRef.current
      if (current.status === 'ANIMATION') {
        runtime.droneGain.gain.setTargetAtTime(0.001, runtime.context.currentTime, 0.025)
        runtime.riserGain.gain.setTargetAtTime(0.001, runtime.context.currentTime, 0.025)
        const previousProgress = lastLaunchProgressRef.current
        if (
          !launchImpactPlayedRef.current &&
          previousProgress !== null &&
          previousProgress < TIMING.blastEnd &&
          current.launchProgress >= TIMING.blastEnd
        ) {
          playImpact(runtime)
          launchImpactPlayedRef.current = true
        }
        const dueCues = previousProgress === null
          ? LAUNCH_SCORE.filter(({ progress }) => progress <= current.launchProgress).slice(-1)
          : LAUNCH_SCORE.filter(({ progress }) =>
              progress > previousProgress && progress <= current.launchProgress,
            )
        for (const cue of dueCues) {
          playLaunchChord(runtime, cue.notes)
        }
        lastLaunchProgressRef.current = current.launchProgress
      } else {
        lastLaunchProgressRef.current = null
        const remaining = current.countdown ?? 10
        const ramp = current.status === 'COUNTDOWN_RUNNING'
          ? clamp((10 - remaining) / 10)
          : 0
        runtime.droneGain.gain.setTargetAtTime(VOLUME.drone * (1 - ramp * 0.94), runtime.context.currentTime, 0.2)
        runtime.riser.frequency.setTargetAtTime(54 + ramp * 180, runtime.context.currentTime, 0.1)
        runtime.riserGain.gain.setTargetAtTime(VOLUME.riser * ramp, runtime.context.currentTime, 0.12)
      }
    }, TIMING.stateTickMs)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setServerOffset(serverTime === null ? null : serverTime - Date.now())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [serverTime])

  useEffect(() => {
    if (preview) return
    if (activeState.status === 'NORMAL') {
      const timer = window.setTimeout(onOverlayDone, TIMING.normalDissolveMs)
      return () => window.clearTimeout(timer)
    }
    if (activeState.status === 'LAUNCHED') {
      const timer = window.setTimeout(onOverlayDone, TIMING.dissolveMs)
      return () => window.clearTimeout(timer)
    }
  }, [activeState.status, onOverlayDone, preview])

  useEffect(() => {
    const previousStatus = previousStatusRef.current
    if (activeState.status !== previousStatus) {
      previousStatusRef.current = activeState.status
      launchImpactPlayedRef.current = false
    }
  }, [activeState.status])

  const contentStyle: LaunchStyle = {
    '--boot-type-duration': `${TIMING.bootTypeMs}ms`,
    '--dissolve-duration': `${activeState.status === 'NORMAL' ? TIMING.normalDissolveMs : TIMING.dissolveMs}ms`,
    '--digit-duration': `${TIMING.digitMs}ms`,
    '--shake-duration': `${TIMING.shakeMs}ms`,
    '--logo-pulse-duration': `${TIMING.logoPulseMs}ms`,
    '--logo-transition-duration': `${TIMING.logoTransitionMs}ms`,
    '--logo-opacity': activeState.status === 'ANIMATION'
      ? easeOutExpo(clamp((launchProgress - CORE_CONFIG.launch.lockStart) / 0.18))
      : activeState.status === 'LAUNCHED' ? 1 : 0,
  }

  const isLaunchPhase = activeState.status === 'ANIMATION' || activeState.status === 'LAUNCHED'
  const launchFlashOpacity = isLaunchPhase
    ? clamp(1 - Math.abs(launchProgress - 0.19) / 0.03)
    : 0
  const logoClassName = [
    'launch-brand',
    activeState.status === 'STAY_TUNED' ? 'launch-brand-standby' : '',
    isLaunchPhase ? 'launch-brand-lock' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={`launch-overlay${activeState.status === 'NORMAL' || activeState.status === 'LAUNCHED' ? ' launch-overlay-dissolving' : ''}`}
      data-final-countdown={activeState.status === 'COUNTDOWN_RUNNING' && countdown !== null && countdown <= 10}
      data-launch-phase={
        isLaunchPhase && launchProgress < CORE_CONFIG.launch.silenceEnd
          ? 'implode'
          : isLaunchPhase && launchProgress < CORE_CONFIG.launch.blastEnd
            ? 'silence'
            : isLaunchPhase && launchProgress < CORE_CONFIG.launch.scatterEnd
              ? 'blast'
              : isLaunchPhase && launchProgress < CORE_CONFIG.launch.morphEnd
                ? 'morph'
                : isLaunchPhase ? 'locked' : undefined
      }
      data-status={activeState.status}
      style={contentStyle}
      onPointerDown={(event) => {
        event.stopPropagation()
        if (document.fullscreenElement || !document.documentElement.requestFullscreen) return
        void document.documentElement.requestFullscreen().catch(() => {
          // Fullscreen remains optional when the browser denies the request.
        })
        void audioRef.current?.context.resume().catch(() => {
          // The sequence stays silent if the browser continues to block audio.
        })
      }}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Nexora launch transmission"
    >
      <LaunchCoreScene
        visual={visual}
        onUnavailable={() => setWebglUnavailable(true)}
      />
      {launchFlashOpacity > 0 && (
        <div
          className="launch-flash"
          style={{ opacity: launchFlashOpacity }}
          aria-hidden="true"
        />
      )}

      {webglUnavailable && <div className="launch-fallback-x" aria-hidden="true">X</div>}

      <div className="launch-hud" aria-hidden="true">
        {activeState.status === 'STAY_TUNED' && <div className="launch-scanline" />}
        {(activeState.status === 'STAY_TUNED' || activeState.status === 'COUNTDOWN_RUNNING') && (
          <>
            <div className="launch-boot-log">
              {shownBootLines.map((line) => <p key={line.text}>{line.text}</p>)}
              {activeState.status === 'STAY_TUNED' && <p className="launch-log-idle">[ SYS ] signal integrity nominal</p>}
            </div>
            {activeState.status === 'COUNTDOWN_RUNNING' && (
              <div className="launch-system-progress">
                <span>SYSTEM INITIALISING</span>
                <span>{systemProgress}%</span>
                <i><b style={{ width: `${systemProgress}%` }} /></i>
              </div>
            )}
            {activeState.status === 'STAY_TUNED' && (
              <div className="launch-transmission">
                {TEXT.standby.split('').map((character, index) => (
                  <span
                    key={`${character}-${index}`}
                    className={character === ' ' ? 'launch-transmission-space' : undefined}
                    style={{ animationDelay: `${index * 54}ms` }}
                  >
                    {character === ' ' ? '\u00a0' : character}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {activeState.status === 'COUNTDOWN_RUNNING' && countdown !== null && (
          <div className="launch-countdown-readout" key={countdown}>
            <span className="launch-countdown-label">T-MINUS</span>
            <span className="launch-countdown-digits">{String(countdown).padStart(2, '0')}</span>
          </div>
        )}

        {(activeState.status === 'STAY_TUNED' || isLaunchPhase) && (
          <Image
            src="/logo-navbar.png"
            alt={TEXT.launch}
            width={960}
            height={320}
            priority
            className={logoClassName}
          />
        )}
      </div>
    </div>
  )
}

export default LaunchOverlay
