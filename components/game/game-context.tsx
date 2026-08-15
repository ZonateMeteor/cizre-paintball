'use client'

import { createContext, useContext } from 'react'
import type { GameEngine } from '@/lib/game/engine'

export const GameContext = createContext<GameEngine | null>(null)

export function useEngine(): GameEngine {
  const e = useContext(GameContext)
  if (!e) throw new Error('GameEngine bulunamadı')
  return e
}
