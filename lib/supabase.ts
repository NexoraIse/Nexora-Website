import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key'

/**
 * Shared Supabase Client Singleton.
 * Configured for client and server-side storage & public asset management.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Helper to retrieve public URL of an asset in Supabase storage.
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}