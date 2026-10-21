import { Pool } from 'pg'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma Client Singleton for Nexora Website.
 * Configured with @prisma/adapter-pg using an explicit pg.Pool for pooled PostgreSQL
 * connections on Supabase.
 *
 * Prevents (EMAXCONNSESSION) connection exhaustion:
 * 1. Automatically uses Supabase's transaction pooler (port 6543) instead of session pooler (port 5432).
 * 2. Caches pg.Pool on globalThis during development so Turbopack/Next.js HMR does not leak pools.
 * 3. Enforces bounded pool size and idle connection timeouts.
 */
function resolveDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexora_db'
  // If pointing to Supabase pooler on port 5432 (session mode, max 15 clients),
  // route to port 6543 (transaction mode) to avoid EMAXCONNSESSION
  if (url.includes('.pooler.supabase.com:5432')) {
    url = url.replace(':5432', ':6543')
  }
  return url
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: Pool
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: resolveDatabaseUrl(),
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pgPool = pool
}

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}