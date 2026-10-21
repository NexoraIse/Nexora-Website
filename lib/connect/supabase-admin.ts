import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export function createConnectSupabaseAdminClient() {
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY.includes('[TOKEN]')
  ) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured for Connect account administration.')
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
