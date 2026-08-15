'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getSupabaseBrowser } from './supabase/client'
import { usernameToEmail } from './supabase/config'
import type { Profile } from './types'

type AuthState = {
  loading: boolean
  userId: string | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signUp: (username: string, password: string) => Promise<{ error?: string }>
  signIn: (username: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowser()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = useCallback(
    async (id: string) => {
      if (!supabase) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (data) setProfile(data as Profile)
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId)
  }, [userId, loadProfile])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const id = data.session?.user.id ?? null
      setUserId(id)
      if (id) await loadProfile(id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const id = session?.user.id ?? null
      setUserId(id)
      if (id) await loadProfile(id)
      else setProfile(null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase, loadProfile])

  const signUp = useCallback(
    async (username: string, password: string) => {
      if (!supabase) return { error: 'Supabase yapılandırılmamış.' }
      const clean = username.trim()

      // Kaydı sunucu tarafında oluştur (e-posta onayı gerekmeden).
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return { error: json.error ?? 'Kayıt oluşturulamadı.' }

      // Otomatik giriş yap.
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(clean),
        password,
      })
      if (error) return { error: error.message }
      return {}
    },
    [supabase],
  )

  const signIn = useCallback(
    async (username: string, password: string) => {
      if (!supabase) return { error: 'Supabase yapılandırılmamış.' }
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username.trim()),
        password,
      })
      if (error) return { error: 'Kullanıcı adı veya şifre hatalı.' }
      return {}
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
    setUserId(null)
  }, [supabase])

  const value = useMemo(
    () => ({ loading, userId, profile, refreshProfile, signUp, signIn, signOut }),
    [loading, userId, profile, refreshProfile, signUp, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
