import { redirect } from 'next/navigation'

export default function ConnectRosterPage() {
  redirect('/admin?tab=connect-roster')
}
