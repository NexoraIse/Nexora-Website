import type { Metadata } from 'next'
import DirectoryPage from '@/components/connect/DirectoryPage'

export const metadata: Metadata = {
  title: 'Nexora Connect | Find your people',
  description: 'Meet students and alumni from the ISE community at AJIET.',
}

export default function ConnectPage() {
  return <DirectoryPage />
}
