'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import {
  leaveLobby,
  sendMessage,
  setMap as setLobbyMap,
  setTeam as setMemberTeam,
} from '@/lib/lobby-api'
import { sendGameInvite } from '@/lib/invite-api'
import type { Lobby, LobbyMember, LobbyMessage, Profile } from '@/lib/types'
import { GAME_MAPS } from '@/lib/types'
import { FriendsPanel } from './friends-panel'
import {
  ArrowLeft,
  Copy,
  Crosshair,
  Send,
  Users,
  MessageSquare,
  Check,
  Play,
} from 'lucide-react'

export function LobbyScreen({
  lobby: initialLobby,
  onLeave,
}: {
  lobby: Lobby
  onLeave: () => void
}) {
  const { userId, profile } = useAuth()
  const [lobby, setLobby] = useState<Lobby>(initialLobby)
  const [members, setMembers] = useState<LobbyMember[]>([])
  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [pane, setPane] = useState<'lobby' | 'chat'>('lobby')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isHost = lobby.host_id === userId

  const loadMembers = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const { data } = await supabase
      .from('lobby_members')
      .select('*')
      .eq('lobby_id', lobby.id)
      .order('joined_at', { ascending: true })
    if (!data) return
    const rows = data as LobbyMember[]
    const ids = rows.map((r) => r.user_id)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    const pMap = new Map<string, Profile>()
    ;(profiles as Profile[] | null)?.forEach((p) => pMap.set(p.id, p))
    setMembers(rows.map((r) => ({ ...r, profile: pMap.get(r.user_id) })))
  }, [lobby.id])

  const loadMessages = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const { data } = await supabase
      .from('lobby_messages')
      .select('*')
      .eq('lobby_id', lobby.id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as LobbyMessage[])
  }, [lobby.id])

  useEffect(() => {
    loadMembers()
    loadMessages()
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    const channel = supabase
      .channel(`lobby:${lobby.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_members', filter: `lobby_id=eq.${lobby.id}` },
        () => loadMembers(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `lobby_id=eq.${lobby.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as LobbyMessage]),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobby.id}` },
        (payload) => setLobby(payload.new as Lobby),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobby.id}` },
        () => onLeave(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobby.id, loadMembers, loadMessages, onLeave])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !userId || !profile) return
    const content = input.trim()
    setInput('')
    await sendMessage(lobby.id, userId, profile.username, content)
  }

  async function handleLeave() {
    if (userId) await leaveLobby(userId, lobby)
    onLeave()
  }

  function copyCode() {
    navigator.clipboard?.writeText(lobby.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const teamA = members.filter((m) => m.team === 'A')
  const teamB = members.filter((m) => m.team === 'B')
  const myTeam = members.find((m) => m.user_id === userId)?.team
  const currentMap = GAME_MAPS.find((m) => m.id === lobby.map) ?? GAME_MAPS[0]
  const canStart = members.length >= 1 // deneme amaçlı tek oyuncuya da izin

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={handleLeave} className="rounded-xl border border-border bg-card/60 p-2 active:scale-95" aria-label="Ayrıl">
          <ArrowLeft className="size-4" />
        </button>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 border-glow-purple"
        >
          <span className="font-mono text-lg font-black tracking-[0.3em] text-glow-purple">{lobby.code}</span>
          {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4 text-muted-foreground" />}
        </button>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
          <Users className="size-3.5" /> {members.length}
        </div>
      </header>

      {/* pane switch (mobile) */}
      <div className="grid grid-cols-2 gap-1 border-b border-border bg-background/60 p-2">
        <button
          onClick={() => setPane('lobby')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-bold tracking-wider ${
            pane === 'lobby' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Users className="size-3.5" /> LOBİ
        </button>
        <button
          onClick={() => setPane('chat')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-bold tracking-wider ${
            pane === 'chat' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          }`}
        >
          <MessageSquare className="size-3.5" /> CHAT
        </button>
      </div>

      {pane === 'lobby' ? (
        <div className="flex-1 px-4 py-4">
          {/* Map */}
          <div className="mb-4 rounded-xl border border-primary/30 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Crosshair className="size-5" />
              </div>
              <div>
                <p className="text-[0.6rem] tracking-widest text-muted-foreground">HARİTA</p>
                <p className="font-mono text-sm font-bold">{currentMap.name}</p>
              </div>
            </div>
            {isHost && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {GAME_MAPS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setLobbyMap(lobby.id, m.id)}
                    className={`rounded-lg border px-2 py-2 font-mono text-[0.6rem] font-bold tracking-wider transition-all ${
                      lobby.map === m.id
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-3">
            <TeamColumn
              title="TAKIM MOR"
              accent="purple"
              members={teamA}
              hostId={lobby.host_id}
              onJoin={myTeam !== 'A' ? () => userId && setMemberTeam(userId, lobby.id, 'A') : undefined}
            />
            <TeamColumn
              title="TAKIM CYAN"
              accent="cyan"
              members={teamB}
              hostId={lobby.host_id}
              onJoin={myTeam !== 'B' ? () => userId && setMemberTeam(userId, lobby.id, 'B') : undefined}
            />
          </div>

          {/* Invite friends */}
          <button
            onClick={() => setShowFriends((s) => !s)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 py-2.5 font-mono text-xs font-bold tracking-wider text-accent"
          >
            <Send className="size-4" /> ARKADAŞ DAVET ET
          </button>
          {showFriends && userId && (
            <div className="mt-3 rounded-xl border border-border bg-card/60 p-3">
              <FriendsPanel
                userId={userId}
                canInvite
                onInvite={(f) => {
                  if (userId) sendGameInvite(userId, f.profile.id, lobby.id)
                }}
              />
            </div>
          )}

          {isHost && (
            <button
              disabled={!canStart}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-mono text-sm font-black tracking-widest text-primary-foreground border-glow-purple active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="size-4" /> MAÇI BAŞLAT
            </button>
          )}
          <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
            {isHost
              ? 'Oyun çekirdeği bir sonraki aşamada geliyor. Şimdilik lobi ve chat aktif.'
              : 'Kurucunun maçı başlatmasını bekleyin.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-xs text-muted-foreground">Henüz mesaj yok. İlk mesajı sen yaz.</p>
            )}
            {messages.map((m) => {
              const mine = m.user_id === userId
              return (
                <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <span className="mb-0.5 px-1 font-mono text-[0.6rem] tracking-wider text-muted-foreground">
                    {m.username}
                  </span>
                  <span
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-card-foreground'
                    }`}
                  >
                    {m.content}
                  </span>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 border-t border-border bg-background/80 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesaj yaz..."
              className="flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-accent px-4 text-accent-foreground border-glow-cyan disabled:opacity-50"
              aria-label="Gönder"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function TeamColumn({
  title,
  accent,
  members,
  hostId,
  onJoin,
}: {
  title: string
  accent: 'purple' | 'cyan'
  members: LobbyMember[]
  hostId: string
  onJoin?: () => void
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border bg-card/40 p-3 ${
        accent === 'purple' ? 'border-primary/40' : 'border-accent/40'
      }`}
    >
      <p
        className={`mb-2 font-mono text-[0.65rem] font-bold tracking-widest ${
          accent === 'purple' ? 'text-primary' : 'text-accent'
        }`}
      >
        {title}
      </p>
      <ul className="flex flex-1 flex-col gap-1.5">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-1.5 rounded-lg bg-background/50 px-2 py-1.5 text-xs"
          >
            <span
              className={`size-1.5 rounded-full ${accent === 'purple' ? 'bg-primary' : 'bg-accent'}`}
            />
            <span className="truncate">{m.profile?.username ?? '...'}</span>
            {m.user_id === hostId && (
              <span className="ml-auto font-mono text-[0.5rem] tracking-wider text-muted-foreground">
                HOST
              </span>
            )}
          </li>
        ))}
        {members.length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-2 py-3 text-center text-[0.65rem] text-muted-foreground">
            Boş
          </li>
        )}
      </ul>
      {onJoin && (
        <button
          onClick={onJoin}
          className={`mt-2 rounded-lg py-1.5 font-mono text-[0.6rem] font-bold tracking-wider ${
            accent === 'purple' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
          }`}
        >
          KATIL
        </button>
      )}
    </div>
  )
}
