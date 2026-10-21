import type { Metadata } from 'next'
import AccountPage from '@/components/connect/AccountPage'

export const metadata: Metadata = { title: 'Your Connect space' }

export default function ConnectDashboardPage() {
  return <AccountPage />
}
