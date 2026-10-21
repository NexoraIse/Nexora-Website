'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const lastStatusRef = useRef(initialLaunchState.status)

  // Direct fetch function for initial sync and fallbacks
  const fetchLatestState = useCallback(async () => {
    try {
      const res = await fetch('/api/launch', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.state) {
        setLaunchState(data.state)
      }
    } catch {
      // background sync catch
    }
  }, [])

  // Manage overlay mounted state and router refresh on launch completion
  useEffect(() => {
    const prevStatus = lastStatusRef.current
    const nextStatus = launchState.status
    lastStatusRef.current = nextStatus

    if (isOverlayStatus(nextStatus)) {
      setOverlayMounted(true)
    }

    // When transitioning from a launch phase to LAUNCHED or NORMAL, refresh server components
    if (
      (prevStatus === 'ANIMATION' || prevStatus === 'COUNTDOWN_RUNNING' || prevStatus === 'STAY_TUNED') &&
      (nextStatus === 'LAUNCHED' || nextStatus === 'NORMAL')
    ) {
      router.refresh()
    }
  }, [launchState.status, router])

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
            setLaunchState(payload)
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
          if (!pollInterval) {
            pollInterval = setInterval(fetchLatestState, 2500)
          }
        })
      } catch {
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
  }, [fetchLatestState])

  const handleOverlayDone = useCallback(() => {
    setOverlayMounted(false)
  }, [])

  const isCurrentlyInLaunch = isOverlayStatus(launchState.status)

  return (
    <>
      {/* Underlying Homepage Experience */}
      <HomePageExperience suppressPreloader={overlayMounted || isCurrentlyInLaunch}>
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
