import { NextResponse, connection } from 'next/server'
import { getPublicLaunchState } from '@/lib/launch/state'

export async function GET() {
  await connection()
  try {
    const state = await getPublicLaunchState()
    return NextResponse.json({ state })
  } catch (err) {
    console.error('Public launch state error:', err)
    return NextResponse.json({ error: 'Failed to fetch launch state.' }, { status: 500 })
  }
}
