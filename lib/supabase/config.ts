export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0

// Kullanıcı adı tabanlı auth için sentetik e-posta.
// Supabase Auth e-posta ister; kullanıcıya sadece username gösteriyoruz.
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@cizre.paintball`
}
