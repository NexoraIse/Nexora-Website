import type { Metadata } from 'next'
import KnowledgePage from '@/components/connect/KnowledgePage'

export const metadata: Metadata = { title: 'Knowledge page | Nexora Connect' }

export default function ConnectKnowledgePage() {
  return <KnowledgePage />
}
