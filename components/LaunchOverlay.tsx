'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import Preloader from '@/components/Preloader'
import type { PublicLaunchState } from '@/lib/launch/types'

type LaunchOverlayProps = {
  state: PublicLaunchState
  onOverlayDone: () => void
}

// 14 columns x 9 rows master matrix
const COLS = 14
const ROWS = 9

// Standard 9x6 geometric digit patterns for precise dot matrix typography
const DIGITS_MAP: Record<string, string[]> = {
  '0': [
    '.xxxx.',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    '.xxxx.',
  ],
  '1': [
    '.xx.',
    'xxx.',
    '.xx.',
    '.xx.',
    '.xx.',
    '.xx.',
    '.xx.',
    '.xx.',
    'xxxx',
  ],
  '2': [
    '.xxxx.',
    'xx..xx',
    '....xx',
    '...xx.',
    '..xx..',
    '.xx...',
    'xx....',
    'xx....',
    'xxxxxx',
  ],
  '3': [
    'xxxxx.',
    '....xx',
    '....xx',
    '..xxx.',
    '....xx',
    '....xx',
    '....xx',
    'xx..xx',
    '.xxxx.',
  ],
  '4': [
    '...xx.',
    '..xxx.',
    '.xxxx.',
    'xx..xx',
    'xx..xx',
    'xxxxxx',
    '...xx.',
    '...xx.',
    '...xx.',
  ],
  '5': [
    'xxxxxx',
    'xx....',
    'xxxxx.',
    '....xx',
    '....xx',
    '....xx',
    '....xx',
    'xx..xx',
    '.xxxx.',
  ],
  '6': [
    '.xxxx.',
    'xx....',
    'xx....',
    'xxxxx.',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    '.xxxx.',
  ],
  '7': [
    'xxxxxx',
    '....xx',
    '...xx.',
    '...xx.',
    '..xx..',
    '..xx..',
    '.xx...',
    '.xx...',
    '.xx...',
  ],
  '8': [
    '.xxxx.',
    'xx..xx',
    'xx..xx',
    '.xxxx.',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    '.xxxx.',
  ],
  '9': [
    '.xxxx.',
    'xx..xx',
    'xx..xx',
    'xx..xx',
    '.xxxxx',
    '....xx',
    '....xx',
    '....xx',
    '.xxxx.',
  ],
}

function computeActiveDots(num: number): number[] {
  const active: number[] = []
  if (num === 10) {
    // "1" at col 1..4, "0" at col 7..12 in 14-col grid
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 4; c++) {
        if (DIGITS_MAP['1'][r][c] === 'x') active.push(r * 14 + (1 + c))
      }
      for (let c = 0; c < 6; c++) {
        if (DIGITS_MAP['0'][r][c] === 'x') active.push(r * 14 + (7 + c))
      }
    }
  } else {
    // Center single 6-col digit at cols 4..9 in 14-col grid
    const pattern = num === 1 ? [
      '..xx..',
      '.xxx..',
      '..xx..',
      '..xx..',
      '..xx..',
      '..xx..',
      '..xx..',
      '..xx..',
      'xxxxxx',
    ] : DIGITS_MAP[String(num)]

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 6; c++) {
        if (pattern[r][c] === 'x') active.push(r * 14 + (4 + c))
      }
    }
  }
  return active
}

// Precompute dot indices for sequence 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
const ACTIVE_DOTS_BY_NUMBER: Record<number, number[]> = {}
for (let i = 1; i <= 10; i++) {
  ACTIVE_DOTS_BY_NUMBER[i] = computeActiveDots(i)
}

export default function LaunchOverlay({ state, onOverlayDone }: LaunchOverlayProps) {
  // Current active countdown number: 10 down to 1, or null for blank screen
  const [currentNumber, setCurrentNumber] = useState<number | null>(() => {
    return state.status === 'COUNTDOWN_RUNNING' ? 10 : null
  })

  // Controls transition to the main branch preloader animation
  const [showPreloader, setShowPreloader] = useState(() => state.status === 'ANIMATION')
  const [isStandby, setIsStandby] = useState(() => state.status === 'STAY_TUNED')

  // Guard: strictly run countdown ONCE and never cancel prematurely
  const countdownStartedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Dot coordinates in SVG canvas (560 x 360)
  const dotCoords = useMemo(() => {
    const coords: { cx: number; cy: number }[] = []
    const colGap = 36
    const rowGap = 36
    const startX = 46
    const startY = 36

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        coords.push({
          cx: startX + c * colGap,
          cy: startY + r * rowGap,
        })
      }
    }
    return coords
  }, [])

  // Master Countdown Sequence: 10 -> 9 -> 8 -> 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> blank (400ms) -> Preloader
  useEffect(() => {
    if (!hasMounted) return

    // If website is placed in STAY_TUNED standby mode
    if (state.status === 'STAY_TUNED' && !countdownStartedRef.current) {
      setIsStandby(true)
      return
    }

    // If status is ANIMATION directly and countdown hasn't run, show preloader immediately
    if (state.status === 'ANIMATION' && !countdownStartedRef.current) {
      countdownStartedRef.current = true
      setIsStandby(false)
      setShowPreloader(true)
      return
    }

    // Trigger countdown when status is COUNTDOWN_RUNNING and not started yet
    if (state.status === 'COUNTDOWN_RUNNING' && !countdownStartedRef.current) {
      countdownStartedRef.current = true
      setIsStandby(false)

      // Start at 10 immediately
      setCurrentNumber(10)

      let current = 10
      timerRef.current = setInterval(() => {
        current -= 1
        if (current >= 1) {
          setCurrentNumber(current)
        } else {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          // 1 concludes: transition to clean blank black screen
          setCurrentNumber(null)

          // Blank black screen for 400ms, then launch the default main branch preloader animation
          setTimeout(() => {
            setShowPreloader(true)
          }, 400)
        }
      }, 1000)
    }
  }, [hasMounted, state.status])

  // When showPreloader is active, render Preloader directly so its curtain-lift (-translate-y-full rounded-b-[50%])
  // smoothly reveals the live homepage underneath without an extra black container blocking it!
  if (showPreloader) {
    return <Preloader onFinish={onOverlayDone} />
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#000000] text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      suppressHydrationWarning
    >
      {/* ── 1. STAY TUNED STANDBY SCREEN ── */}
      {isStandby && (
        <div className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
          <img
            src="/logo-navbar.png"
            alt="NEXORA"
            className="h-14 sm:h-20 w-auto object-contain select-none mb-6 drop-shadow-[0_0_25px_rgba(0,240,255,0.75)] animate-pulse"
          />
          <h1 className="font-[var(--font-clash-display)] text-4xl sm:text-6xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]">
            STAY TUNED
          </h1>
          <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-xs tracking-[0.3em] text-cyan-300/80 uppercase">
            TRANSMISSION STANDBY
          </p>
        </div>
      )}

      {/* ── 2. SVG DOT-MATRIX COUNTDOWN (10 TO 1 ONCE) ── */}
      {!isStandby && (
        <div className="relative flex items-center justify-center w-full max-w-[92vw] sm:max-w-[85vw] md:max-w-[700px] lg:max-w-[820px]">
          <svg
            className="w-full h-auto overflow-visible"
            viewBox="0 0 560 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* White core with restrained electric cyan halo glow */}
              <filter id="matrixCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feFlood floodColor="#00f0ff" floodOpacity="0.8" result="cyanHalo" />
                <feComposite in="cyanHalo" in2="blur" operator="in" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 14x9 Dot-Matrix Circles with Synchronous State Binding */}
            {dotCoords.map((coord, idx) => {
              const isActive =
                currentNumber !== null &&
                ACTIVE_DOTS_BY_NUMBER[currentNumber]?.includes(idx)

              return (
                <circle
                  key={`matrix-dot-${idx}`}
                  cx={coord.cx}
                  cy={coord.cy}
                  r={6.5}
                  fill="#ffffff"
                  opacity={isActive ? 1 : 0.04}
                  stroke={isActive ? 'rgba(0, 240, 255, 0.65)' : 'none'}
                  strokeWidth={isActive ? 1.4 : 0}
                  filter={isActive ? 'url(#matrixCyanGlow)' : undefined}
                  style={{
                    transformOrigin: `${coord.cx}px ${coord.cy}px`,
                    transform: isActive ? 'scale(1)' : 'scale(0.85)',
                    transition: 'opacity 0.22s ease-out, transform 0.22s ease-out, stroke 0.22s ease-out',
                  }}
                  suppressHydrationWarning
                />
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
