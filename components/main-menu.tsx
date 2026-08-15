'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import { createLobby, joinLobbyByCode, joinLobbyById } from '@/lib/lobby-api'
import type { GameInvite, Lobby, Profile } from '@/lib/types'
import { GAME_MAPS } from '@/lib/types'
import { FriendsPanel } from './friends-panel'
import {
  Coins,
  Crosshair,
  DoorOpen,
  Loader2,
  LogOut,
  Plus,
  Skull,
  Swords,
  Target,
  Trophy,
  Users,
} from 'lucide-react'

export function MainMenu({ onEnterLobby }: { onEnterLobby: (lobby: Lobby) => void }) {
  const { profile, userId, signOut } = useAuth()
  const [tab, setTab] = useState<'play' | 'friends'>('play')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invites, setInvites] = useState<GameInvite[]>([])

  useEffect(() => {
    if (!userId) return
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    async function loadInvites() {
      const { data } = await supabase!
        .from('game_invites')
        .select('*')
        .eq('to_user', userId!)
        .eq('status', 'pending')
      if (!data) return
      const withProfiles = await Promise.all(
        (data as GameInvite[]).map(async (inv) => {
          const { data: p } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', inv.from_user)
            .maybeSingle()
          return { ...inv, from_profile: (p as Profile) ?? undefined }
        }),
      )
      setInvites(withProfiles)
    }

    loadInvites()
    const channel = supabase
      .channel(`invites:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_invites', filter: `to_user=eq.${userId}` },
        () => loadInvites(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function handleCreate(map: string) {
    if (!userId) return
    setBusy(true)
    setError('')
    const { lobby, error } = await createLobby(userId, map)
    setBusy(false)
    if (error) setError(error)
    else if (lobby) onEnterLobby(lobby)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !code.trim()) return
    setBusy(true)
    setError('')
    const { lobby, error } = await joinLobbyByCode(userId, code)
    setBusy(false)
    if (error) setError(error)
    else if (lobby) onEnterLobby(lobby)
  }

  async function acceptInvite(inv: GameInvite) {
    if (!userId) return
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    await supabase.from('game_invites').update({ status: 'accepted' }).eq('id', inv.id)
    const res = await joinLobbyById(userId, inv.lobby_id)
    if (res.lobby) onEnterLobby(res.lobby)
    else if (res.error) setError(res.error)
  }

  async function declineInvite(inv: GameInvite) {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    await supabase.from('game_invites').update({ status: 'declined' }).eq('id', inv.id)
  }

  if (!profile) return null

  const kd = profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills.toFixed(2)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* HUD header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/50 bg-primary/15 text-primary border-glow-purple">
              <Crosshair className="size-5" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold tracking-wider">{profile.username}</p>
              <p className="flex items-center gap-1 text-xs text-accent">
                <Coins className="size-3" /> {profile.money}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="rounded-xl border border-border bg-card/60 p-2 text-muted-foreground active:scale-95"
            aria-label="Çıkış yap"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {/* Invites banner */}
        {invites.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-3 py-2.5 border-glow-purple"
              >
                <p className="text-xs">
                  <span className="font-bold text-primary">
                    {inv.from_profile?.username ?? 'Bir oyuncu'}
                  </span>{' '}
                  seni lobiye davet etti
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(inv)}
                    className="rounded-lg bg-accent px-3 py-1 font-mono text-[0.6rem] font-bold text-accent-foreground"
                  >
                    KATIL
                  </button>
                  <button
                    onClick={() => declineInvite(inv)}
                    className="rounded-lg bg-destructive/20 px-2 py-1 font-mono text-[0.6rem] font-bold text-destructive"
                  >
                    RED
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          <StatCard icon={<Trophy className="size-4" />} label="GALİBİYET" value={profile.wins} accent="cyan" />
          <StatCard icon={<Swords className="size-4" />} label="MAÇ" value={profile.matches_played} accent="purple" />
          <StatCard icon={<Target className="size-4" />} label="KILL" value={profile.kills} accent="cyan" />
          <StatCard icon={<Skull className="size-4" />} label="K/D" value={kd} accent="purple" />
        </div>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-card/60 p-1">
          <button
            onClick={() => setTab('play')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-bold tracking-wider transition-all ${
              tab === 'play' ? 'bg-primary text-primary-foreground border-glow-purple' : 'text-muted-foreground'
            }`}
          >
            <Swords className="size-3.5" /> OYNA
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-bold tracking-wider transition-all ${
              tab === 'friends' ? 'bg-accent text-accent-foreground border-glow-cyan' : 'text-muted-foreground'
            }`}
          >
            <Users className="size-3.5" /> ARKADAŞLAR
          </button>
        </div>

        {tab === 'play' ? (
          <div className="flex flex-col gap-4">
            {/* Join by code */}
            <form onSubmit={handleJoin} className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 focus-within:border-accent">
                <DoorOpen className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LOBİ KODU"
                  maxLength={6}
                  className="w-full bg-transparent py-3 font-mono text-sm tracking-widest outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="rounded-xl bg-accent px-5 font-mono text-xs font-bold text-accent-foreground border-glow-cyan disabled:opacity-50"
              >
                KATIL
              </button>
            </form>

            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.65rem] tracking-widest text-muted-foreground">
                <Plus className="size-3.5" /> LOBİ OLUŞTUR — HARİTA SEÇ
              </p>
              <div className="grid grid-cols-1 gap-2">
                {GAME_MAPS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleCreate(m.id)}
                    disabled={busy}
                    className={`group flex items-center gap-3 rounded-xl border bg-card/60 p-3 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                      m.accent === 'purple'
                        ? 'border-primary/30 hover:border-primary/60'
                        : 'border-accent/30 hover:border-accent/60'
                    }`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                        m.accent === 'purple' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                      }`}
                    >
                      <Crosshair className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold tracking-wide">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    {busy && <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          userId && <FriendsPanel userId={userId} />
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: 'purple' | 'cyan'
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/60 py-2.5">
      <span className={accent === 'purple' ? 'text-primary' : 'text-accent'}>{icon}</span>
      <span className="font-mono text-base font-bold leading-none">{value}</span>
      <span className="text-[0.55rem] tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}
