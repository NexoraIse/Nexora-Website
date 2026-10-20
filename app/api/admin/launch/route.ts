import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rateLimit'
import { enableCountdown, getPublicLaunchState, resetLaunch, startLaunchCountdown } from '@/lib/launch/state'


function isAdminRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!isAdminRole(admin.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const state = await getPublicLaunchState()
    return NextResponse.json({ state })
  } catch (err) {
    console.error('Admin launch GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch launch state.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!isAdminRole(admin.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    if (!rateLimit(req, `admin-launch:${admin.id}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many launch actions. Please wait and try again.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : ''

    if (action === 'enable_countdown') {
      const state = await enableCountdown(admin.id)
      await recordAuditLog({
        action: 'UPDATE',
        entity: 'WebsiteLaunch',
        details: `Enabled launch countdown mode. State: ${state.status}`,
        adminId: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      })
      return NextResponse.json({ success: true, state, message: 'Countdown mode enabled.' })
    }

    if (action === 'launch') {
      const result = await startLaunchCountdown(admin.id)
      await recordAuditLog({
        action: 'UPDATE',
        entity: 'WebsiteLaunch',
        details: result.alreadyRunning
          ? 'Launch action ignored because countdown is already running.'
          : `Launch initiated. State: ${result.state.status}`,
        adminId: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      })

      return NextResponse.json({
        success: true,
        state: result.state,
        message: result.alreadyRunning
          ? 'Countdown is already running; existing schedule kept.'
          : 'Launch countdown started.',
      })
    }

    if (action === 'reset') {
      const state = await resetLaunch(admin.id)
      await recordAuditLog({
        action: 'UPDATE',
        entity: 'WebsiteLaunch',
        details: 'Launch sequence reset to NORMAL state.',
        adminId: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      })
      return NextResponse.json({ success: true, state, message: 'Launch reset to normal homepage.' })
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  } catch (err) {
    console.error('Admin launch mutation failed:', err)
    return NextResponse.json({ error: 'Failed to update launch state.' }, { status: 500 })
  }
}
