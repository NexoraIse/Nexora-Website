/**
 * =============================================================================
 * NEXORA WEB PLATFORM - ENVIRONMENT CONFIGURATION & VALIDATION
 * Centralized, type-safe access to environment variables with helpful warnings.
 * =============================================================================
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validates whether required variables are configured and logs actionable warnings.
 */
function getEnvVar(key: string, fallback = '', isRequired = false): string {
  const value = process.env[key] || fallback;

  if (isRequired && !process.env[key]) {
    if (isProduction) {
      console.warn(`[CONFIG WARNING] Missing required environment variable: ${key}`);
    } else {
      console.debug(`[CONFIG NOTICE] '${key}' not set in local environment, using fallback.`);
    }
  }

  return value;
}

export const env = {
  // Runtime Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: !isProduction,
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOSTNAME: process.env.HOSTNAME || '0.0.0.0',

  // Database (PostgreSQL / Supabase via Prisma)
  DATABASE_URL: getEnvVar(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/nexora_db',
    true
  ),
  DIRECT_URL: getEnvVar(
    'DIRECT_URL',
    'postgresql://postgres:postgres@localhost:5432/nexora_db'
  ),

  // Supabase Client & Storage
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://placeholder.supabase.co',
    true
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key',
    true
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: getEnvVar(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  ),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

  // Security & Authentication
  ADMIN_JWT_SECRET: getEnvVar(
    'ADMIN_JWT_SECRET',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'nexora-admin-development-secret-2026',
    true
  ),
  CONNECT_LOOKUP_HMAC_SECRET: getEnvVar('CONNECT_LOOKUP_HMAC_SECRET', '', true),
  CONNECT_APP_URL: getEnvVar('CONNECT_APP_URL'),
} as const;

export default env;
