'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let connectSupabaseClient: SupabaseClient | undefined

export function createConnectSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('The Connect Supabase client can only be used in the browser.')
  }

  if (connectSupabaseClient) return connectSupabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    throw new Error('Supabase authentication is not configured.')
  }

  connectSupabaseClient = createBrowserClient(url, key)
  return connectSupabaseClient
}
