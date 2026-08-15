import { getSupabaseBrowser } from './supabase/client'

export async function sendGameInvite(fromUser: string, toUser: string, lobbyId: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return { error: 'Supabase yok.' }

  // Aynı lobiye bekleyen davet varsa tekrar gönderme
  const { data: existing } = await supabase
    .from('game_invites')
    .select('id')
    .eq('from_user', fromUser)
    .eq('to_user', toUser)
    .eq('lobby_id', lobbyId)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) return {}

  const { error } = await supabase
    .from('game_invites')
    .insert({ from_user: fromUser, to_user: toUser, lobby_id: lobbyId, status: 'pending' })
  if (error) return { error: error.message }
  return {}
}
