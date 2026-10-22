'use client'

import React, { useEffect, useState, useCallback } from 'react'
import HomePageExperience from '@/components/HomePageExperience'
import LaunchOverlay from '@/components/LaunchOverlay'
import type { PublicLaunchState } from '@/lib/launch/types'

type HomepageLaunchGateProps = {
  initialLaunchState: PublicLaunchState
  children: React.ReactNode
}

function isOverlayStatus(status: string) {
  return status === 'STAY_TUNED' || status === 'COUNTDOWN_RUNNING' || status === 'ANIMATION'
}

export default function HomepageLaunchGate({ initialLaunchState, children }: HomepageLaunchGateProps) {
  const [launchState, setLaunchState] = useState<PublicLaunchState>(initialLaunchState)
  const [overlayMounted, setOverlayMounted] = useState(() => isOverlayStatus(initialLaunchState.status))
  const [postLaunchCycle, setPostLaunchCycle] = useState(0)

  const updateLaunchState = useCallback((state: PublicLaunchState) => {
    setLaunchState(state)
    if (isOverlayStatus(state.status)) {
      setOverlayMounted(true)
    }
  }, [])

  // Direct fetch function for initial sync and fallbacks
  const fetchLatestState = useCallback(async () => {
    try {
      const res = await fetch('/api/launch', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.state) {
        updateLaunchState(data.state)
      }
    } catch {
      // background sync catch
    }
  }, [updateLaunchState])

  // Persistent Real-time SSE Connection across all devices
  useEffect(() => {
    let sse: EventSource | null = null
    let pollInterval: NodeJS.Timeout | null = null

    const connectSSE = () => {
      try {
        sse = new EventSource('/api/launch/stream')

        sse.addEventListener('state', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data) as PublicLaunchState
            updateLaunchState(payload)
          } catch {
            void fetchLatestState()
          }
        })

        sse.addEventListener('error', () => {
          // If SSE encounters an issue, fallback to polling
          if (sse) {
            sse.close()
            sse = null
          }
          void fetchLatestState()
          if (!pollInterval) {
            pollInterval = setInterval(fetchLatestState, 2500)
          }
        })
      } catch {
        void fetchLatestState()
        if (!pollInterval) {
          pollInterval = setInterval(fetchLatestState, 2500)
        }
      }
    }

    connectSSE()

    // Window focus & tab visibility listener for instant sync
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchLatestState()
      }
    }
    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    return () => {
      if (sse) sse.close()
      if (pollInterval) clearInterval(pollInterval)
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [fetchLatestState, updateLaunchState])

  const handleOverlayDone = useCallback(() => {
    if (launchState.status === 'LAUNCHED') {
      try {
        sessionStorage.removeItem('preloaderShown')
      } catch (error) {
        console.error('Failed to reset the homepage preloader after launch:', error)
      }
      setPostLaunchCycle((cycle) => cycle + 1)
    }
    setOverlayMounted(false)
  }, [launchState.status])

  return (
    <>
      <HomePageExperience
        launchActive={overlayMounted}
        postLaunchCycle={postLaunchCycle}
      >
        {children}
      </HomePageExperience>

      {/* Synchronized Launch Overlay */}
      {overlayMounted && (
        <LaunchOverlay
          state={launchState}
          onOverlayDone={handleOverlayDone}
        />
      )}
    </>
  )
}
