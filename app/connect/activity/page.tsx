import type { Metadata } from 'next'
import { Suspense } from 'react'
import ActivityPage from '@/components/connect/ActivityPage'

export const metadata: Metadata = { title: 'Community activity | Nexora Connect' }

export default function ConnectActivityPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#060913]" />}><ActivityPage /></Suspense>
}
