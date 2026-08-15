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
      if (clean.length < 3) return { error: 'Kullanıcı adı en az 3 karakter olmalı.' }
      if (password.length < 6) return { error: 'Şifre en az 6 karakter olmalı.' }

      // Kullanıcı adı benzersiz mi?
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle()
      if (existing) return { error: 'Bu kullanıcı adı zaten alınmış.' }

      const { data, error } = await supabase.auth.signUp({
        email: usernameToEmail(clean),
        password,
      })
      if (error) return { error: error.message }
      const newId = data.user?.id
      if (!newId) return { error: 'Kayıt oluşturulamadı.' }

      const { error: pErr } = await supabase.from('profiles').insert({
        id: newId,
        username: clean,
        money: 800,
      })
      if (pErr) return { error: pErr.message }

      await loadProfile(newId)
      return {}
    },
    [supabase, loadProfile],
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
