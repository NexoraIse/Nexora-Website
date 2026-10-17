import type { Metadata } from 'next'
import AuthPage from '@/components/connect/AuthPage'

export const metadata: Metadata = { title: 'Continue with Google | Nexora Connect' }

export default function SignUpPage() {
  return <AuthPage mode="auth" />
}
