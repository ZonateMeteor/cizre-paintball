'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import {
  acceptFriend,
  loadFriends,
  removeFriend,
  sendFriendRequest,
} from '@/lib/friends-api'
import type { FriendView } from '@/lib/types'
import { Check, Send, UserPlus, X, Users } from 'lucide-react'

export function FriendsPanel({
  userId,
  onInvite,
  canInvite,
}: {
  userId: string
  onInvite?: (friend: FriendView) => void
  canInvite?: boolean
}) {
  const [friends, setFriends] = useState<FriendView[]>([])
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setFriends(await loadFriends(userId))
  }, [userId])

  useEffect(() => {
    refresh()
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const channel = supabase
      .channel(`friends:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friends' },
        () => refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    const { error } = await sendFriendRequest(userId, name)
    setBusy(false)
    if (error) setMsg(error)
    else {
      setMsg('İstek gönderildi.')
      setName('')
      refresh()
    }
  }

  const incoming = friends.filter((f) => f.direction === 'incoming')
  const accepted = friends.filter((f) => f.status === 'accepted')
  const outgoing = friends.filter((f) => f.direction === 'outgoing')

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 focus-within:border-accent">
          <UserPlus className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kullanıcı adı ile ekle"
            autoCapitalize="none"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-xl bg-accent px-4 font-mono text-xs font-bold text-accent-foreground border-glow-cyan disabled:opacity-50"
        >
          EKLE
        </button>
      </form>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

      {incoming.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[0.65rem] tracking-widest text-accent">
            GELEN İSTEKLER
          </p>
          <ul className="flex flex-col gap-2">
            {incoming.map((f) => (
              <li
                key={f.rowId}
                className="flex items-center justify-between rounded-xl border border-accent/30 bg-card/60 px-3 py-2"
              >
                <span className="text-sm font-medium">{f.profile.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await acceptFriend(f.rowId)
                      refresh()
                    }}
                    className="rounded-lg bg-accent/20 p-1.5 text-accent"
                    aria-label="Kabul et"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await removeFriend(f.rowId)
                      refresh()
                    }}
                    className="rounded-lg bg-destructive/20 p-1.5 text-destructive"
                    aria-label="Reddet"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.65rem] tracking-widest text-muted-foreground">
          <Users className="size-3.5" /> ARKADAŞLAR ({accepted.length})
        </p>
        {accepted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Henüz arkadaşın yok.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accepted.map((f) => (
              <li
                key={f.rowId}
                className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-3 py-2"
              >
                <span className="text-sm font-medium">{f.profile.username}</span>
                <div className="flex gap-2">
                  {canInvite && onInvite && (
                    <button
                      onClick={() => onInvite(f)}
                      className="flex items-center gap-1 rounded-lg bg-primary/20 px-2 py-1 font-mono text-[0.6rem] font-bold tracking-wider text-primary"
                    >
                      <Send className="size-3" /> DAVET
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await removeFriend(f.rowId)
                      refresh()
                    }}
                    className="rounded-lg bg-destructive/20 p-1.5 text-destructive"
                    aria-label="Sil"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {outgoing.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[0.65rem] tracking-widest text-muted-foreground">
            BEKLEYEN ({outgoing.length})
          </p>
          <ul className="flex flex-col gap-2">
            {outgoing.map((f) => (
              <li
                key={f.rowId}
                className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-3 py-2 text-muted-foreground"
              >
                <span className="text-sm">{f.profile.username}</span>
                <span className="font-mono text-[0.6rem] tracking-wider">BEKLİYOR</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
