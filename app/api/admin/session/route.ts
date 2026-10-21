import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/admin_session=([^;]+)/)
    const token = match ? match[1] : null

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const admin = verifyAdminToken(token)
    if (!admin) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name || 'Administrator',
        role: admin.role || 'ADMIN',
      },
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    console.error('Session verification error:', err)
    return NextResponse.json({ authenticated: false })
  }
}
