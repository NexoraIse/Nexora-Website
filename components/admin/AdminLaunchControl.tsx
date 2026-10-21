'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Rocket, Clock, RefreshCw, AlertTriangle, ExternalLink, CheckCircle2, X } from 'lucide-react'
import type { PublicLaunchState } from '@/lib/launch/types'

interface AdminLaunchControlProps {
  userRole: string
}

export default function AdminLaunchControl({ userRole }: AdminLaunchControlProps) {
  const [state, setState] = useState<PublicLaunchState | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)

  const isPermitted = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/launch', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.state) {
        setState(data.state)
      }
    } catch {
      // ignore background poll errors
    }
  }, [])

  useEffect(() => {
    if (!isPermitted) return
    void fetchState()
    const interval = setInterval(fetchState, 5000)
    return () => clearInterval(interval)
  }, [fetchState, isPermitted])

  // Live timer tick for running countdown
  useEffect(() => {
    if (!state || state.status !== 'COUNTDOWN_RUNNING' || !state.countdownEndsAt) {
      setSecondsRemaining(null)
      return
    }

    const calculateRemaining = () => {
      const end = new Date(state.countdownEndsAt!).getTime()
      const diff = Math.ceil((end - Date.now()) / 1000)
      setSecondsRemaining(Math.max(0, diff))
    }

    calculateRemaining()
    const timer = setInterval(calculateRemaining, 500)
    return () => clearInterval(timer)
  }, [state])

  if (!isPermitted) {
    return null
  }

  const handleAction = async (action: 'launch' | 'enable_countdown' | 'reset') => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    setConfirmAction(null)

    try {
      const res = await fetch('/api/admin/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update launch status.')
      }

      if (data.state) {
        setState(data.state)
      }
      setSuccessMessage(data.message || 'Updated successfully.')
      void fetchState()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  // Button badge rendering based on state
  const isCountdownRunning = state?.status === 'COUNTDOWN_RUNNING'
  const isStayTuned = state?.status === 'STAY_TUNED'
  const isAnimation = state?.status === 'ANIMATION'

  return (
    <>
      {/* Navbar Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true)
          setError(null)
          setSuccessMessage(null)
          setConfirmAction(null)
          void fetchState()
        }}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98] ${
          isCountdownRunning
            ? 'animate-pulse bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-red-500/25'
            : isStayTuned
            ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
            : isAnimation
            ? 'bg-purple-600 text-white'
            : 'border border-[#E2E8F0] bg-white text-[#111827] hover:bg-[#F8FAFC]'
        }`}
        title="Open Launch Countdown Controls"
      >
        <Rocket className={`h-3.5 w-3.5 ${isCountdownRunning ? 'animate-bounce' : 'text-[#64748B]'}`} />
        <span className="hidden sm:inline">
          {isCountdownRunning
            ? `Launching in ${secondsRemaining !== null ? secondsRemaining : '...'}s`
            : isStayTuned
            ? 'Stay Tuned Active'
            : isAnimation
            ? 'Launch Ceremony...'
            : 'Launch Countdown'}
        </span>
        <span className="sm:hidden">
          {isCountdownRunning ? `${secondsRemaining ?? ''}s` : 'Launch'}
        </span>
      </button>

      {/* Launch Control Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E2E8F0] text-[#111827] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#111827] to-[#1E293B] text-white">
                  <Rocket className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Website Launch Ceremony</h3>
                  <p className="text-xs text-[#64748B]">Control the public countdown and live release</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className="my-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B]">CURRENT STATUS</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isCountdownRunning
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : isStayTuned
                      ? 'bg-amber-100 text-amber-700'
                      : state?.status === 'LAUNCHED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {state?.status || 'NORMAL'}
                </span>
              </div>

              {isCountdownRunning && secondsRemaining !== null && (
                <div className="mt-3 text-center">
                  <div className="text-3xl font-extrabold tracking-tight text-red-600 font-mono">
                    {secondsRemaining}s
                  </div>
                  <p className="text-xs text-red-500 font-medium">Countdown is actively ticking for all visitors</p>
                </div>
              )}

              <p className="mt-2 text-xs text-[#475569]">
                {state?.status === 'COUNTDOWN_RUNNING'
                  ? 'The live countdown overlay is showing for all website visitors.'
                  : state?.status === 'STAY_TUNED'
                  ? 'Visitors currently see the "Stay Tuned" teaser screen before the ceremony.'
                  : state?.status === 'ANIMATION'
                  ? 'Launch sequence completion animation is in progress.'
                  : state?.status === 'LAUNCHED'
                  ? 'The website has officially been launched.'
                  : 'Website is in normal mode. The homepage is fully accessible.'}
              </p>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Confirmation Alert */}
            {confirmAction === 'launch' && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3.5">
                <h4 className="text-xs font-bold text-red-900">Start Public Countdown?</h4>
                <p className="mt-1 text-xs text-red-700">
                  This will start the live 10-second countdown on the public homepage for all connected visitors!
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void handleAction('launch')}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Starting...' : 'Yes, Launch Now'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={isLoading}
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {confirmAction === 'reset' && (
              <div className="mb-4 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-3.5">
                <h4 className="text-xs font-bold text-[#111827]">Reset to Normal Homepage?</h4>
                <p className="mt-1 text-xs text-[#475569]">
                  This clears the countdown and restores standard homepage access for all users immediately.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void handleAction('reset')}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-[#111827] py-1.5 text-xs font-bold text-white hover:bg-[#1E293B] disabled:opacity-50"
                  >
                    {isLoading ? 'Resetting...' : 'Yes, Reset State'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={isLoading}
                    className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions Grid */}
            <div className="space-y-2">
              <button
                onClick={() => setConfirmAction('launch')}
                disabled={isLoading || isCountdownRunning}
                className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-red-500/20 hover:from-red-700 hover:to-amber-700 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <Rocket className="h-4 w-4" />
                  <span>Start Live Countdown</span>
                </div>
                <span className="text-[10px] font-normal opacity-85">10-Second Timer</span>
              </button>

              <button
                onClick={() => void handleAction('enable_countdown')}
                disabled={isLoading || isStayTuned}
                className="w-full flex items-center justify-between rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Enable &quot;Stay Tuned&quot; Teaser</span>
                </div>
                <span className="text-[10px] text-[#64748B]">Pre-launch screen</span>
              </button>

              <button
                onClick={() => setConfirmAction('reset')}
                disabled={isLoading || state?.status === 'NORMAL'}
                className="w-full flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset to Normal Homepage</span>
                </div>
                <span className="text-[10px]">NORMAL state</span>
              </button>
            </div>

            {/* Footer with Homepage link */}
            <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827] hover:underline"
              >
                <span>Preview Public Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => void fetchState()}
                className="text-[11px] text-[#64748B] hover:text-[#111827] flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

