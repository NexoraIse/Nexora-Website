import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Opening Nexora Connect' }

export default function ConnectStartPage() {
  redirect('/connect/dashboard')
}
