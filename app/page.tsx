'use client'

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { SetupNotice } from '@/components/setup-notice'
import { AuthScreen } from '@/components/auth-screen'
import { MainMenu } from '@/components/main-menu'
import { LobbyScreen } from '@/components/lobby-screen'
import type { Lobby } from '@/lib/types'
import { Loader2 } from 'lucide-react'

function Game() {
  const { loading, userId, profile } = useAuth()
  const [lobby, setLobby] = useState<Lobby | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userId || !profile) return <AuthScreen />

  if (lobby) return <LobbyScreen lobby={lobby} onLeave={() => setLobby(null)} />

  return <MainMenu onEnterLobby={setLobby} />
}

export default function Page() {
  if (!isSupabaseConfigured) return <SetupNotice />

  return (
    <AuthProvider>
      <Game />
    </AuthProvider>
  )
}
