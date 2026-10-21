import { NextResponse } from 'next/server'
import { createConnectSupabaseServerClient, isSameOriginRequest } from '@/lib/connect/auth'
import { rethrowNextControlFlow } from '@/lib/connect/validation'

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    const supabase = await createConnectSupabaseServerClient(response)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Connect signout failed:', error.message)
      return NextResponse.json({ error: 'Unable to sign out right now.' }, { status: 502 })
    }
    supabase.applyCookies(response)
    return response
  } catch (error) {
    rethrowNextControlFlow(error)
    console.error('Connect signout failed:', error)
    return NextResponse.json({ error: 'Unable to sign out right now.' }, { status: 500 })
  }
}
