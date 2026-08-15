'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Crosshair, Loader2, Lock, User } from 'lucide-react'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(username, password)
    if (error) setError(error)
    setBusy(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 p-3 border-glow-purple">
          <Crosshair className="size-8 text-primary" />
        </div>
        <h1 className="font-mono text-3xl font-black tracking-[0.2em] text-glow-purple">
          CIZRE
        </h1>
        <h2 className="font-mono text-xl font-bold tracking-[0.35em] text-accent text-glow-cyan">
          PAINTBALL
        </h2>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1">
          <button
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`rounded-lg py-2 font-mono text-xs font-bold tracking-wider transition-all ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground border-glow-purple'
                : 'text-muted-foreground'
            }`}
          >
            GİRİŞ YAP
          </button>
          <button
            onClick={() => {
              setMode('register')
              setError('')
            }}
            className={`rounded-lg py-2 font-mono text-xs font-bold tracking-wider transition-all ${
              mode === 'register'
                ? 'bg-primary text-primary-foreground border-glow-purple'
                : 'text-muted-foreground'
            }`}
          >
            KAYIT OL
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 focus-within:border-primary">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı"
              autoCapitalize="none"
              autoComplete="username"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 focus-within:border-primary">
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-mono text-sm font-bold tracking-widest text-primary-foreground border-glow-purple transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === 'login' ? 'SAHAYA GİR' : 'HESAP OLUŞTUR'}
          </button>
        </form>
      </div>

      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        Neon multiplayer lasertag arenasına hoş geldin. Kod ile lobiye katıl,
        arkadaşlarını davet et, sahaya çık.
      </p>
    </div>
  )
}
