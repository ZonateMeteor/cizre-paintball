import { getSupabaseBrowser } from './supabase/client'
import type { FriendRow, FriendView, Profile } from './types'

export async function sendFriendRequest(userId: string, username: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return { error: 'Supabase yok.' }

  const { data: target } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.trim())
    .maybeSingle()
  if (!target) return { error: 'Böyle bir kullanıcı yok.' }
  if ((target as Profile).id === userId) return { error: 'Kendini ekleyemezsin.' }

  const targetId = (target as Profile).id

  // Zaten var mı? (iki yönlü kontrol)
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${userId})`,
    )
    .maybeSingle()
  if (existing) return { error: 'Zaten istek gönderilmiş veya arkadaşsınız.' }

  const { error } = await supabase
    .from('friends')
    .insert({ user_id: userId, friend_id: targetId, status: 'pending' })
  if (error) return { error: error.message }
  return {}
}

export async function acceptFriend(rowId: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase.from('friends').update({ status: 'accepted' }).eq('id', rowId)
}

export async function removeFriend(rowId: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase.from('friends').delete().eq('id', rowId)
}

export async function loadFriends(userId: string): Promise<FriendView[]> {
  const supabase = getSupabaseBrowser()
  if (!supabase) return []

  const { data: rows } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  if (!rows) return []

  const otherIds = (rows as FriendRow[]).map((r) =>
    r.user_id === userId ? r.friend_id : r.user_id,
  )
  if (otherIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', otherIds)

  const map = new Map<string, Profile>()
  ;(profiles as Profile[] | null)?.forEach((p) => map.set(p.id, p))

  return (rows as FriendRow[])
    .map((r): FriendView | null => {
      const otherId = r.user_id === userId ? r.friend_id : r.user_id
      const profile = map.get(otherId)
      if (!profile) return null
      let direction: FriendView['direction'] = 'friends'
      if (r.status === 'pending') {
        direction = r.user_id === userId ? 'outgoing' : 'incoming'
      }
      return { rowId: r.id, profile, status: r.status, direction }
    })
    .filter((x): x is FriendView => x !== null)
}
