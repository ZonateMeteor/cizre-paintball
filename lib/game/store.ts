import { useSyncExternalStore } from 'react'
import type { WeaponId } from './config'

// --- Girdi singleton (her frame okunur, React re-render yok) ---
export const controls = {
  moveX: 0,
  moveY: 0,
  lookDX: 0,
  lookDY: 0,
  firing: false,
  jumpQueued: false,
  reloadQueued: false,
  grenadeQueued: false,
  switchQueued: false,
}

export function resetControls() {
  controls.moveX = 0
  controls.moveY = 0
  controls.lookDX = 0
  controls.lookDY = 0
  controls.firing = false
  controls.jumpQueued = false
  controls.reloadQueued = false
  controls.grenadeQueued = false
  controls.switchQueued = false
}

// --- HUD store ---
export type Phase = 'buy' | 'live' | 'roundend' | 'matchend'

export type KillFeedItem = {
  id: number
  attacker: string
  victim: string
  weapon: string
  attackerTeam: 'A' | 'B'
}

export type HudState = {
  phase: Phase
  roundNum: number
  scoreA: number
  scoreB: number
  timer: number
  health: number
  shield: number
  ammo: number
  reserve: number
  grenades: number
  money: number
  alive: boolean
  reloading: boolean
  weaponId: WeaponId
  killfeed: KillFeedItem[]
  roundResult: 'A' | 'B' | null
  matchWinner: 'A' | 'B' | null
  aliveA: number
  aliveB: number
  hitMarker: number
  damageFlash: number
}

let state: HudState = {
  phase: 'buy',
  roundNum: 1,
  scoreA: 0,
  scoreB: 0,
  timer: 15,
  health: 100,
  shield: 0,
  ammo: 12,
  reserve: 48,
  grenades: 0,
  money: 800,
  alive: true,
  reloading: false,
  weaponId: 'pistol',
  killfeed: [],
  roundResult: null,
  matchWinner: null,
  aliveA: 1,
  aliveB: 1,
  hitMarker: 0,
  damageFlash: 0,
}

const listeners = new Set<() => void>()

export function setHud(patch: Partial<HudState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function getHud() {
  return state
}

export function resetHud() {
  setHud({
    phase: 'buy',
    roundNum: 1,
    scoreA: 0,
    scoreB: 0,
    timer: 15,
    health: 100,
    shield: 0,
    grenades: 0,
    alive: true,
    reloading: false,
    killfeed: [],
    roundResult: null,
    matchWinner: null,
    hitMarker: 0,
    damageFlash: 0,
  })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useHud(): HudState {
  return useSyncExternalStore(subscribe, getHud, getHud)
}

let kfId = 1
export function pushKillFeed(item: Omit<KillFeedItem, 'id'>) {
  const entry = { ...item, id: kfId++ }
  const next = [...state.killfeed, entry].slice(-5)
  setHud({ killfeed: next })
  setTimeout(() => {
    setHud({ killfeed: getHud().killfeed.filter((k) => k.id !== entry.id) })
  }, 5000)
}
