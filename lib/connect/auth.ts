import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, type AdminUser } from '@/lib/admin-auth'
import type { User } from '@supabase/supabase-js'
import { env } from '@/lib/env'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    throw new Error('Supabase authentication is not configured.')
  }

  return { url, key }
}

export async function createConnectSupabaseServerClient(response?: NextResponse) {
  const { url, key } = getSupabaseConfig()
  const cookieStore = await cookies()
  const cookiesWritten: Array<{ name: string; value: string; options?: any }> = []

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Can be ignored in Server Component contexts
          }
          cookiesWritten.push({ name, value, options })
          if (response) {
            response.cookies.set(name, value, options)
          }
        }
      },
    },
  })

  return Object.assign(client, {
    applyCookies(targetResponse: NextResponse) {
      for (const { name, value, options } of cookiesWritten) {
        targetResponse.cookies.set(name, value, options)
      }
      return targetResponse
    },
  })
}

export function isUserEmailVerified(user: User): boolean {
  if (!user.email) return false
  if (user.email_confirmed_at || (user as any).confirmed_at) return true
  if (user.app_metadata?.provider === 'google') return true
  if (user.identities?.some((id) => id.provider === 'google')) return true
  return false
}

export async function getAuthenticatedMember(): Promise<User | null> {
  const supabase = await createConnectSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401) {
      return null
    }

    throw new Error('Unable to verify the member session.', { cause: error })
  }

  if (data.user.app_metadata?.connect_disabled === true) return null
  return data.user
}

export async function getVerifiedMember(): Promise<User | null> {
  const user = await getAuthenticatedMember()
  if (!user?.email || !isUserEmailVerified(user)) return null
  return user
}

export async function getAuthenticatedConnectAdmin(req: Request): Promise<AdminUser | null> {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/)
  const token = cookieMatch?.[1]
  if (!token) return null

  const tokenAdmin = verifyAdminToken(token)
  if (!tokenAdmin) return null

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const [session, admin] = await Promise.all([
    prisma.activeSession.findUnique({ where: { tokenHash } }),
    prisma.admin.findUnique({
      where: { id: tokenAdmin.id },
      select: { id: true, email: true, name: true, role: true },
    }),
  ])

  if (
    !session ||
    !admin ||
    session.expiresAt <= new Date() ||
    session.adminEmail !== admin.email
  ) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  }
}

export function getConnectAppUrl(req: Request): URL {
  const rawConfigured = (
    process.env.CONNECT_APP_URL ||
    env.CONNECT_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    ''
  ).trim()

  if (rawConfigured) {
    try {
      const withProto =
        rawConfigured.startsWith('http://') || rawConfigured.startsWith('https://')
          ? rawConfigured
          : `https://${rawConfigured}`
      const parsed = new URL(withProto)
      return new URL(parsed.origin)
    } catch (e) {
      console.warn('[CONNECT_AUTH] Failed to parse configured CONNECT_APP_URL, falling back to request origin:', e)
    }
  }

  // Fallback: derive origin dynamically from incoming request headers
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || req.headers.get('host')
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const proto = forwardedProto || (isLocal ? 'http' : 'https')
    try {
      return new URL(`${proto}://${host}`)
    } catch {
      // fallback to req.url
    }
  }

  try {
    return new URL(new URL(req.url).origin)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const host = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || req.headers.get('host')
  if (!host) return false

  const protocol = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    || new URL(req.url).protocol.replace(':', '')

  try {
    const originUrl = new URL(origin)
    const requestUrl = new URL(`${protocol}://${host}`)
    return originUrl.origin === requestUrl.origin
  } catch {
    return false
  }
}
