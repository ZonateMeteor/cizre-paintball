'use client'

import { Trophy, Users } from 'lucide-react'
import type { GameEngine } from '@/lib/game/engine'

export function LeaderboardScreen({ engine, onClose }: { engine: GameEngine; onClose: () => void }) {
  const players = Array.from(engine.combatants.values())
    .sort((a, b) => {
      // Sort by XP (descending), then by kills
      if (b.xp !== a.xp) return b.xp - a.xp
      return b.kills - a.kills
    })
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2),
    }))

  const teamA = players.filter((p) => p.team === 'A')
  const teamB = players.filter((p) => p.team === 'B')
  const winner = engine.scoreA > engine.scoreB ? 'A' : 'B'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background/95 p-6">
        {/* Title */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="size-6 text-accent" />
            <h1 className="font-mono text-2xl font-black tracking-wider text-foreground">SCOREBOARD</h1>
            <Trophy className="size-6 text-accent" />
          </div>
          <div className="font-mono text-sm text-muted-foreground">
            {engine.scoreA} - {engine.scoreB}
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
            <h2 className="mb-4 font-mono text-sm font-bold text-secondary">MOV TAKIMI</h2>
            <div className="space-y-2">
              {teamA.map((p) => (
                <div
                  key={p.id}
                  className={`rounded border px-3 py-2 text-xs font-mono transition-all ${
                    winner === 'A'
                      ? 'border-accent/40 bg-accent/10'
                      : 'border-secondary/20 bg-secondary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.username}</span>
                    <span className="text-accent">{p.xp} XP</span>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      Kills: <strong>{p.kills}</strong>
                    </span>
                    <span>
                      Deaths: <strong>{p.deaths}</strong>
                    </span>
                    <span>
                      K/D: <strong>{p.kdr}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team B */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h2 className="mb-4 font-mono text-sm font-bold text-primary">CYAN TAKIMI</h2>
            <div className="space-y-2">
              {teamB.map((p) => (
                <div
                  key={p.id}
                  className={`rounded border px-3 py-2 text-xs font-mono transition-all ${
                    winner === 'B'
                      ? 'border-accent/40 bg-accent/10'
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.username}</span>
                    <span className="text-accent">{p.xp} XP</span>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      Kills: <strong>{p.kills}</strong>
                    </span>
                    <span>
                      Deaths: <strong>{p.deaths}</strong>
                    </span>
                    <span>
                      K/D: <strong>{p.kdr}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="mt-6 rounded-lg border border-border bg-card/30 p-4">
          <h3 className="mb-4 font-mono text-sm font-bold text-foreground">GLOBAL LEADERBOARD</h3>
          <div className="space-y-1">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border border-border/40 bg-background/40 px-3 py-1.5 font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 font-bold text-accent">#{p.rank}</span>
                  <span className="flex-1">{p.username}</span>
                  {p.team === 'A' && <span className="text-secondary">●</span>}
                  {p.team === 'B' && <span className="text-primary">●</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 text-right text-muted-foreground">{p.kills}K</span>
                  <span className="w-12 text-right text-muted-foreground">{p.deaths}D</span>
                  <span className="w-16 text-right font-bold text-accent">{p.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 font-mono text-sm font-bold text-primary transition-all active:scale-95 hover:bg-primary/20"
        >
          MENU'YE DÖN
        </button>
      </div>
    </div>
  )
}
