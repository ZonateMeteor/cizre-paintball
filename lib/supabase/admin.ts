import { createClient } from '@supabase/supabase-js'

// Sunucu tarafı yönetici istemcisi (service_role).
// RLS'i atlar — SADECE sunucu route'larında kullanılır, asla client'a gönderilmez.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
