import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from './prisma'
import { Role, AdminUser } from './types'

export type { Role, AdminUser }

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'nexora-admin-secret-key-2026'

/**
 * Creates a signed HMAC-SHA256 JWT session token for an authenticated administrator.
 */
export function createAdminToken(user: AdminUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days expiration
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
  return `${data}.${signature}`
}

/**
 * Verifies a cryptographic admin token against the secret and checks expiration.
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return null

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
    if (signature !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (!payload.exp || Date.now() > payload.exp) return null

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'ADMIN',
    }
  } catch {
    return null
  }
}

/**
 * Extracts and verifies the active admin session from Request headers or cookies.
 */
export async function getAuthenticatedAdmin(req?: Request): Promise<AdminUser | null> {
  try {
    let token: string | undefined

    if (req) {
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(/admin_session=([^;]+)/)
      token = match ? match[1] : undefined
    }

    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('admin_session')?.value
    }

    if (!token) return null
    return verifyAdminToken(token)
  } catch {
    return null
  }
}

/**
 * Verifies email and bcrypt password credentials against PostgreSQL admins table.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const trimmed = emailInput.trim().toLowerCase()
  if (!trimmed || !passwordInput) {
    return { success: false, error: 'Email and password are required.' }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: trimmed },
    })

    if (!admin || !admin.password) {
      return { success: false, error: 'Invalid email or password.' }
    }

    const isValid = bcrypt.compareSync(passwordInput, admin.password)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' }
    }

    return {
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role as Role,
      },
    }
  } catch (err: unknown) {
    console.error('Database verification error:', err)
    return { success: false, error: 'Authentication service temporarily unavailable.' }
  }
}

/**
 * Creates an immutable forensic audit log entry in the audit_logs table.
 * All audit logs are permanently retained indefinitely; they are never auto-deleted.
 */
export async function recordAuditLog(params: {
  action: string
  entity: string
  entityId?: string
  details?: string
  adminId?: string
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        adminId: params.adminId,
        ipAddress: params.ipAddress,
      },
    })
  } catch (err) {
    console.error('Failed to record audit log:', err)
  }
}
