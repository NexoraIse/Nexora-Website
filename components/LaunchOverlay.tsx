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

// Precompute active dot indices for 1..10
const ACTIVE_DOTS_BY_NUMBER: Record<number, number[]> = {}
for (let i = 1; i <= 10; i++) {
  ACTIVE_DOTS_BY_NUMBER[i] = computeActiveDots(i)
}

export default function LaunchOverlay({ state, onOverlayDone }: LaunchOverlayProps) {
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [showPreloader, setShowPreloader] = useState(false)
  const [isStandby, setIsStandby] = useState(false)

  const onOverlayDoneRef = useRef(onOverlayDone)
  useEffect(() => {
    onOverlayDoneRef.current = onOverlayDone
  })

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

  // Active indices for the current number (if any)
  const activeIndices = useMemo(() => {
    if (currentNumber === null) return new Set<number>()
    return new Set(ACTIVE_DOTS_BY_NUMBER[currentNumber] || [])
  }, [currentNumber])

  // Master Synchronized State Machine across all devices
  useEffect(() => {
    const { status, countdownEndsAt, serverTime } = state

    // If website is already launched or in normal state, dismiss overlay immediately
    if (status === 'LAUNCHED' || status === 'NORMAL') {
      onOverlayDoneRef.current?.()
      return
    }

    // If website is placed in STAY_TUNED standby mode
    if (status === 'STAY_TUNED') {
      setIsStandby(true)
      setShowPreloader(false)
      setCurrentNumber(null)
      return
    }

    // If website is in ANIMATION mode, show Preloader directly
    if (status === 'ANIMATION') {
      setIsStandby(false)
      setShowPreloader(true)
      return
    }

    // When status is COUNTDOWN_RUNNING: sync across all devices via server timestamp
    if (status === 'COUNTDOWN_RUNNING') {
      setIsStandby(false)

      // Calculate clock offset between server and client device
      const serverMs = serverTime ? new Date(serverTime).getTime() : Date.now()
      const clientMs = Date.now()
      const clockOffset = serverMs - clientMs

      const targetEndMs = countdownEndsAt
        ? new Date(countdownEndsAt).getTime()
        : Date.now() + 10000

      let blankTimeout: NodeJS.Timeout | null = null
      let animationFrameId: number | null = null

      const updateSync = () => {
        const nowAdjusted = Date.now() + clockOffset
        const diffMs = targetEndMs - nowAdjusted
        const remainingSec = Math.ceil(diffMs / 1000)

        if (remainingSec >= 1 && remainingSec <= 10) {
          setCurrentNumber(remainingSec)
          animationFrameId = requestAnimationFrame(updateSync)
        } else {
          // Countdown reached 0 on all devices: clear digit to pure black screen
          setCurrentNumber(null)

          // 300ms pure black pause, then launch Nexora preloader animation
          blankTimeout = setTimeout(() => {
            setShowPreloader(true)
          }, 300)
        }
      }

      updateSync()

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
        if (blankTimeout) clearTimeout(blankTimeout)
      }
    }
  }, [state])

  // Direct render of Preloader so the curtain-lift (-translate-y-full) reveals the homepage underneath
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
        <div className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
          <img
            src="/logo-navbar.png"
            alt="NEXORA"
            className="h-12 sm:h-18 w-auto object-contain select-none mb-6 drop-shadow-[0_0_25px_rgba(0,240,255,0.75)] animate-pulse"
          />
          <h1 className="font-[var(--font-clash-display)] text-3xl sm:text-6xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]">
            STAY TUNED
          </h1>
          <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-xs tracking-[0.3em] text-cyan-300/80 uppercase">
            TRANSMISSION STANDBY
          </p>
        </div>
      )}

      {/* ── 2. HIGH-PERFORMANCE SVG DOT-MATRIX COUNTDOWN (10 TO 1) ── */}
      {!isStandby && (
        <div className="relative flex items-center justify-center w-full max-w-[92vw] sm:max-w-[85vw] md:max-w-[700px] lg:max-w-[820px]">
          <svg
            className="w-full h-auto overflow-visible"
            viewBox="0 0 560 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          >
            <defs>
              {/* Single grouped glow filter: eliminates 50 separate filter passes on mobile GPUs */}
              <filter id="matrixCyanGlowGroup" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feFlood floodColor="#00f0ff" floodOpacity="0.85" result="cyanHalo" />
                <feComposite in="cyanHalo" in2="blur" operator="in" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Inactive background dots: grouped and static for zero CPU/GPU overhead */}
            <g fill="#ffffff" opacity={0.04}>
              {dotCoords.map((coord, idx) => {
                if (activeIndices.has(idx)) return null
                return (
                  <circle
                    key={`dot-bg-${idx}`}
                    cx={coord.cx}
                    cy={coord.cy}
                    r={6.5}
                  />
                )
              })}
            </g>

            {/* Active dots: single group filter runs once per frame across all devices */}
            <g filter="url(#matrixCyanGlowGroup)">
              {dotCoords.map((coord, idx) => {
                if (!activeIndices.has(idx)) return null
                return (
                  <circle
                    key={`dot-act-${idx}`}
                    cx={coord.cx}
                    cy={coord.cy}
                    r={6.5}
                    fill="#ffffff"
                    stroke="rgba(0, 240, 255, 0.7)"
                    strokeWidth={1.5}
                  />
                )
              })}
            </g>
          </svg>
        </div>
      )}
    </div>
  )
}
