import type { Metadata } from 'next'
import { Suspense } from 'react'
import PublicProfilePage from '@/components/connect/PublicProfilePage'

export const metadata: Metadata = { title: 'Member | Nexora Connect' }

export default function MemberProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--theme-bg-main,#060913)]" />}>
      <PublicProfilePage />
    </Suspense>
  )
}
