'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from './config'

let cached: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null
  if (cached) return cached
  cached = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return cached
}
