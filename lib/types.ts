export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  skin_url: string | null
  wins: number
  losses: number
  kills: number
  deaths: number
  matches_played: number
  money: number
  created_at: string
}

export type FriendRow = {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export type FriendView = {
  rowId: string
  profile: Profile
  status: 'pending' | 'accepted'
  direction: 'incoming' | 'outgoing' | 'friends'
}

export type Lobby = {
  id: string
  code: string
  host_id: string
  map: string
  status: 'waiting' | 'in_game' | 'finished'
  max_players: number
  created_at: string
}

export type LobbyMember = {
  id: string
  lobby_id: string
  user_id: string
  team: 'A' | 'B'
  ready: boolean
  joined_at: string
  profile?: Profile
}

export type LobbyMessage = {
  id: string
  lobby_id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

export type GameInvite = {
  id: string
  from_user: string
  to_user: string
  lobby_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  from_profile?: Profile
  lobby?: Lobby
}

export type GameMap = {
  id: string
  name: string
  description: string
  accent: 'purple' | 'cyan'
}

export const GAME_MAPS: GameMap[] = [
  {
    id: 'neon_district',
    name: 'Neon District',
    description: 'Işıklı sokaklar ve dar geçitler. Yakın çatışma ağırlıklı.',
    accent: 'purple',
  },
  {
    id: 'cyber_dome',
    name: 'Cyber Dome',
    description: 'Simetrik kubbe arena. Orta mesafe düellolar için ideal.',
    accent: 'cyan',
  },
  {
    id: 'reactor_core',
    name: 'Reactor Core',
    description: 'Çok katlı reaktör. Dikey oyun ve pusu noktaları.',
    accent: 'purple',
  },
  {
    id: 'grid_harbor',
    name: 'Grid Harbor',
    description: 'Açık liman, uzun hatlar. Keskin nişancılar için saha.',
    accent: 'cyan',
  },
]
