'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import type { PublicLaunchState } from '@/lib/launch/types'
import { COUNTDOWN_SECONDS } from '@/lib/launch/types'

type LaunchOverlayProps = {
  state: PublicLaunchState
  onOverlayDone: () => void
}

type OverlayView = 'STAY_TUNED' | 'COUNTDOWN' | 'ANIMATION'

export default function LaunchOverlay({ state, onOverlayDone }: LaunchOverlayProps) {
  const [clockOffset, setClockOffset] = useState<number>(0)
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!state.countdownEndsAt) return 0
    return Math.max(0, new Date(state.countdownEndsAt).getTime() - Date.now())
  })
  const [isExiting, setIsExiting] = useState(false)
  const [animationTick, setAnimationTick] = useState(0)
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calibrate client clock offset against server time
  useEffect(() => {
    if (state.serverTime) {
      const serverMs = new Date(state.serverTime).getTime()
      if (!isNaN(serverMs)) {
        setClockOffset(Date.now() - serverMs)
      }
    }
  }, [state.serverTime])

  // Continuous high-precision countdown loop
  useEffect(() => {
    if (state.status !== 'COUNTDOWN_RUNNING' || !state.countdownEndsAt) {
      return
    }

    const targetMs = new Date(state.countdownEndsAt).getTime()
    let frameId: number

    const tick = () => {
      const now = Date.now() - clockOffset
      const diff = Math.max(0, targetMs - now)
      setRemainingMs(diff)

      if (diff > 0) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [state.status, state.countdownEndsAt, clockOffset])

  // Ambient pulse interval during ANIMATION view
  useEffect(() => {
    if (state.status !== 'ANIMATION') return
    const interval = setInterval(() => {
      setAnimationTick((prev) => (prev + 1) % 100)
    }, 100)
    return () => clearInterval(interval)
  }, [state.status])

  // Handle graceful exit when status becomes NORMAL or LAUNCHED
  useEffect(() => {
    const isLaunchActive =
      state.status === 'STAY_TUNED' ||
      state.status === 'COUNTDOWN_RUNNING' ||
      state.status === 'ANIMATION'

    if (!isLaunchActive) {
      setIsExiting(true)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      exitTimerRef.current = setTimeout(() => {
        onOverlayDone()
      }, 850)
    } else {
      setIsExiting(false)
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [state.status, onOverlayDone])

  const view: OverlayView = useMemo(() => {
    if (state.status === 'STAY_TUNED') return 'STAY_TUNED'
    if (state.status === 'ANIMATION') return 'ANIMATION'
    return 'COUNTDOWN'
  }, [state.status])

  // Countdown calculations
  const totalSeconds = COUNTDOWN_SECONDS || 10
  const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000))
  const progressRatio = Math.max(0, Math.min(1, remainingMs / (totalSeconds * 1000)))

  // SVG Ring values
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progressRatio)

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#030712] text-white transition-all duration-800 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      {/* Dynamic Cyber Ambient Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Glowing Orbs */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-indigo-600/20 blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" />

        {/* Ambient Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Starfield Particles */}
        {Array.from({ length: 40 }).map((_, idx) => (
          <span
            key={`particle-${idx}`}
            className="absolute block h-1 w-1 rounded-full bg-white/40 motion-safe:animate-pulse"
            style={{
              top: `${(idx * 19) % 100}%`,
              left: `${(idx * 27) % 100}%`,
              animationDelay: `${(idx % 8) * 200}ms`,
              animationDuration: `${2000 + (idx % 5) * 800}ms`,
              opacity: 0.15 + (idx % 6) * 0.12,
            }}
          />
        ))}
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex max-w-[92vw] flex-col items-center text-center">
        {/* Brand Logo with Glow */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-2 rounded-full bg-cyan-500/20 blur-md transition group-hover:bg-cyan-500/30" />
          <img
            src="/logo-navbar.png"
            alt="Nexora"
            className="relative h-14 w-auto sm:h-20 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)] select-none"
          />
        </div>

        {/* 1. STAY TUNED VIEW */}
        {view === 'STAY_TUNED' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-[11px] font-mono tracking-widest text-cyan-300 uppercase shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>TRANSMISSION STANDBY</span>
            </div>
            <h1 className="font-[var(--font-clash-display)] text-5xl font-extrabold tracking-[0.2em] sm:text-7xl bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              STAY TUNED
            </h1>
            <p className="mt-5 max-w-md font-[var(--font-ibm-plex-mono)] text-xs tracking-[0.3em] text-cyan-200/80 sm:text-sm">
              THE NEXT EVOLUTION OF NEXORA IS ABOUT TO BEGIN
            </p>
          </div>
        )}

        {/* 2. LIVE SYNCHRONIZED COUNTDOWN VIEW */}
        {view === 'COUNTDOWN' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-3.5 py-1 text-[11px] font-mono tracking-widest text-red-300 uppercase">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE LAUNCH SEQUENCE</span>
            </div>

            {/* Circular Timer Ring Container */}
            <div className="relative flex items-center justify-center my-2">
              <svg
                className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90 transform"
                viewBox="0 0 280 280"
              >
                {/* Background Ring Track */}
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Active Glowing Progress Ring */}
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke="url(#countdownGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-100 ease-linear"
                />
                <defs>
                  <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Centered Large Digits */}
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span
                  key={secondsRemaining}
                  className="font-[var(--font-clash-display)] text-7xl sm:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.7)] animate-in zoom-in-90 fade-in duration-200"
                >
                  {secondsRemaining}
                </span>
                <span className="mt-1 font-[var(--font-ibm-plex-mono)] text-[10px] sm:text-xs tracking-[0.3em] text-white/60 uppercase">
                  SECONDS REMAINING
                </span>
              </div>
            </div>

            <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-xs tracking-[0.25em] text-cyan-300/80">
              SYNCHRONIZING PORTAL ACTIVATION
            </p>
          </div>
        )}

        {/* 3. LAUNCH CEREMONY ANIMATION VIEW */}
        {view === 'ANIMATION' && (
          <div className="animate-in zoom-in-90 fade-in duration-700 flex flex-col items-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-1 text-xs font-mono tracking-widest text-emerald-300 uppercase shadow-lg shadow-emerald-900/40">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVATION COMPLETE</span>
            </div>

            <p className="mb-2 font-[var(--font-ibm-plex-mono)] text-xs sm:text-sm tracking-[0.4em] text-cyan-200/90 uppercase">
              WELCOME TO
            </p>

            <h2
              className="font-[var(--font-clash-display)] text-6xl font-black tracking-[0.16em] sm:text-8xl bg-gradient-to-r from-cyan-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,0.6)]"
              style={{
                transform: `scale(${1 + Math.sin(animationTick * 0.1) * 0.02})`,
                transition: 'transform 100ms ease-out',
              }}
            >
              NEXORA
            </h2>

            <p className="mt-4 max-w-md font-[var(--font-ibm-plex-mono)] text-sm sm:text-base tracking-[0.25em] text-white/90">
              THE PORTAL IS OFFICIALLY LIVE
            </p>

            {/* Glowing expansion beam */}
            <div className="mt-6 h-1 w-36 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
