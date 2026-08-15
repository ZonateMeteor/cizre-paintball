import { getSupabaseBrowser } from './supabase/client'
import type { Lobby } from './types'

function randomCode(len = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function createLobby(hostId: string, map: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return { error: 'Supabase yok.' }

  // Benzersiz kod üret
  let code = randomCode()
  for (let tries = 0; tries < 5; tries++) {
    const { data } = await supabase.from('lobbies').select('id').eq('code', code).maybeSingle()
    if (!data) break
    code = randomCode()
  }

  const { data, error } = await supabase
    .from('lobbies')
    .insert({ code, host_id: hostId, map, status: 'waiting' })
    .select('*')
    .single()
  if (error) return { error: error.message }

  const lobby = data as Lobby
  const { error: mErr } = await supabase
    .from('lobby_members')
    .insert({ lobby_id: lobby.id, user_id: hostId, team: 'A' })
  if (mErr) return { error: mErr.message }

  return { lobby }
}

export async function joinLobbyByCode(userId: string, code: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return { error: 'Supabase yok.' }

  const { data: lobby } = await supabase
    .from('lobbies')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  if (!lobby) return { error: 'Bu kodla bir lobi bulunamadı.' }

  return joinLobbyById(userId, (lobby as Lobby).id)
}

export async function joinLobbyById(userId: string, lobbyId: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return { error: 'Supabase yok.' }

  const { data: lobby } = await supabase
    .from('lobbies')
    .select('*')
    .eq('id', lobbyId)
    .maybeSingle()
  if (!lobby) return { error: 'Lobi bulunamadı.' }

  const { data: members } = await supabase
    .from('lobby_members')
    .select('team, user_id')
    .eq('lobby_id', lobbyId)

  const existing = members?.find((m) => m.user_id === userId)
  if (!existing) {
    if ((members?.length ?? 0) >= (lobby as Lobby).max_players)
      return { error: 'Lobi dolu.' }
    // Takımları dengele
    const teamA = members?.filter((m) => m.team === 'A').length ?? 0
    const teamB = members?.filter((m) => m.team === 'B').length ?? 0
    const team = teamA <= teamB ? 'A' : 'B'
    const { error } = await supabase
      .from('lobby_members')
      .insert({ lobby_id: lobbyId, user_id: userId, team })
    if (error) return { error: error.message }
  }

  return { lobby: lobby as Lobby }
}

export async function leaveLobby(userId: string, lobby: Lobby) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase
    .from('lobby_members')
    .delete()
    .eq('lobby_id', lobby.id)
    .eq('user_id', userId)

  // Host çıkıyorsa lobiyi kapat
  if (lobby.host_id === userId) {
    await supabase.from('lobbies').delete().eq('id', lobby.id)
  }
}

export async function sendMessage(
  lobbyId: string,
  userId: string,
  username: string,
  content: string,
) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase
    .from('lobby_messages')
    .insert({ lobby_id: lobbyId, user_id: userId, username, content })
}

export async function setTeam(userId: string, lobbyId: string, team: 'A' | 'B') {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase
    .from('lobby_members')
    .update({ team })
    .eq('lobby_id', lobbyId)
    .eq('user_id', userId)
}

export async function setMap(lobbyId: string, map: string) {
  const supabase = getSupabaseBrowser()
  if (!supabase) return
  await supabase.from('lobbies').update({ map }).eq('id', lobbyId)
}
