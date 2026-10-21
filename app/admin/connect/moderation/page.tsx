import { redirect } from 'next/navigation'

export default function ConnectModerationPage() {
  redirect('/admin?tab=connect-moderation')
}
