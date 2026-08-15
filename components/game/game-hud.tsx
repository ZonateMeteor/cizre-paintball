"use client"

import { useEffect, useRef } from "react"
import { controls, useHud } from "@/lib/game/store"
import { WEAPONS, GEAR } from "@/lib/game/config"
import { useEngine } from "./game-context"

// --- Joystick (sol alt) ---
function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeId = useRef<number | null>(null)
  const center = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const base = baseRef.current!
    const knob = knobRef.current!
    const radius = 46

    function setVec(dx: number, dy: number) {
      const len = Math.hypot(dx, dy)
      const clamped = Math.min(len, radius)
      const nx = len > 0 ? dx / len : 0
      const ny = len > 0 ? dy / len : 0
      knob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`
      controls.moveX = (nx * clamped) / radius
      controls.moveY = (ny * clamped) / radius
    }
    function reset() {
      knob.style.transform = "translate(0px, 0px)"
      controls.moveX = 0
      controls.moveY = 0
      activeId.current = null
    }
    function onDown(e: PointerEvent) {
      if (activeId.current !== null) return
      activeId.current = e.pointerId
      const r = base.getBoundingClientRect()
      center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      setVec(e.clientX - center.current.x, e.clientY - center.current.y)
    }
    function onMove(e: PointerEvent) {
      if (e.pointerId !== activeId.current) return
      setVec(e.clientX - center.current.x, e.clientY - center.current.y)
    }
    function onUp(e: PointerEvent) {
      if (e.pointerId !== activeId.current) return
      reset()
    }
    base.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      base.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto absolute bottom-6 left-6 h-32 w-32 rounded-full border border-secondary/40 bg-secondary/5"
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0 rounded-full border border-secondary/20" />
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary bg-secondary/30 shadow-[0_0_18px_hsl(var(--secondary)/0.6)]"
      />
    </div>
  )
}

// --- Bakış alanı (tüm ekran; joystick/butonlar üstte kendi eventini yakalar) ---
function LookArea() {
  const activeId = useRef<number | null>(null)
  const last = useRef({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current!
    function onDown(e: PointerEvent) {
      if (activeId.current !== null) return
      activeId.current = e.pointerId
      last.current = { x: e.clientX, y: e.clientY }
    }
    function onMove(e: PointerEvent) {
      if (e.pointerId !== activeId.current) return
      controls.lookDX += e.clientX - last.current.x
      controls.lookDY += e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
    }
    function onUp(e: PointerEvent) {
      if (e.pointerId !== activeId.current) return
      activeId.current = null
    }
    el.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  return <div ref={ref} className="pointer-events-auto absolute inset-0" style={{ touchAction: "none" }} />
}

function ActionButton({
  label,
  className,
  onDown,
  onUp,
}: {
  label: string
  className: string
  onDown?: () => void
  onUp?: () => void
}) {
  return (
    <button
      className={`pointer-events-auto select-none rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider active:scale-95 ${className}`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault()
        onDown?.()
      }}
      onPointerUp={(e) => {
        e.preventDefault()
        onUp?.()
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

// --- Buy Menu for Buy Phase ---
function BuyMenu() {
  const engine = useEngine()
  const hud = useHud()

  if (hud.phase !== 'buy') return null

  const canAfford = (price: number) => hud.money >= price

  return (
    <div className="pointer-events-auto absolute bottom-20 left-1/2 max-h-72 w-96 -translate-x-1/2 overflow-y-auto rounded-lg border border-secondary/60 bg-background/90 p-3 backdrop-blur-md">
      <div className="mb-3 text-center font-mono text-sm font-bold text-secondary">SILAH MARKET</div>
      <div className="space-y-2">
        {(Object.values(WEAPONS) as typeof WEAPONS.pistol[]).map((w) => (
          <button
            key={w.id}
            onClick={() => engine?.buyWeapon(w.id as any)}
            disabled={!canAfford(w.price)}
            className={`w-full rounded border px-2 py-1 text-left font-mono text-xs transition-all ${
              canAfford(w.price)
                ? 'border-secondary/40 bg-secondary/10 text-secondary active:scale-95 hover:bg-secondary/20'
                : 'border-border/40 bg-border/10 text-muted-foreground'
            }`}
          >
            <div className="flex justify-between">
              <span>{w.name}</span>
              <span className={canAfford(w.price) ? 'text-accent' : 'text-muted-foreground'}>${w.price}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="mb-3 mt-4 text-center font-mono text-sm font-bold text-primary">EKIPMAN</div>
      <div className="space-y-2">
        {(Object.values(GEAR) as typeof GEAR.shield_light[]).map((g) => (
          <button
            key={g.id}
            onClick={() => engine?.buyGear(g.id as any)}
            disabled={!canAfford(g.price)}
            className={`w-full rounded border px-2 py-1 text-left font-mono text-xs transition-all ${
              canAfford(g.price)
                ? 'border-primary/40 bg-primary/10 text-primary active:scale-95 hover:bg-primary/20'
                : 'border-border/40 bg-border/10 text-muted-foreground'
            }`}
          >
            <div className="flex justify-between">
              <span>{g.name}</span>
              <span className={canAfford(g.price) ? 'text-accent' : 'text-muted-foreground'}>${g.price}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const TEAM_A_CLASS = "text-secondary drop-shadow-[0_0_6px_hsl(var(--secondary)/0.8)]"
const TEAM_B_CLASS = "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]"

export function GameHud() {
  const hud = useHud()
  const hpPct = Math.max(0, Math.min(100, hud.health))
  const shieldPct = Math.max(0, Math.min(100, hud.shield))
  const weapon = WEAPONS[hud.weaponId]

  const now = performance.now()
  const showHit = now - hud.hitMarker < 120
  const showDamage = now - hud.damageFlash < 180

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden font-sans text-foreground">
      <LookArea />

      {/* Hasar flaşı - daha belirgin */}
      {showDamage && (
        <div className="absolute inset-0 animate-pulse bg-red-600/20" style={{
          animation: 'pulse 0.2s ease-out'
        }} />
      )}

      {/* Üst skor barı */}
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background/70 px-4 py-1.5 backdrop-blur-sm">
        <span className={`font-mono text-lg font-bold ${TEAM_A_CLASS}`}>{hud.scoreA}</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[10px] text-muted-foreground">TUR {hud.roundNum}</span>
          <span className="font-mono text-xs text-foreground">{hud.timer}</span>
        </div>
        <span className={`font-mono text-lg font-bold ${TEAM_B_CLASS}`}>{hud.scoreB}</span>
      </div>

      {/* Kalan oyuncu */}
      <div className="absolute right-4 top-3 flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-1 backdrop-blur-sm">
        <span className={`font-mono text-sm font-bold ${TEAM_A_CLASS}`}>{hud.aliveA}</span>
        <span className="text-xs text-muted-foreground">vs</span>
        <span className={`font-mono text-sm font-bold ${TEAM_B_CLASS}`}>{hud.aliveB}</span>
      </div>

      {/* Killfeed */}
      <div className="absolute right-4 top-14 flex flex-col items-end gap-1">
        {hud.killfeed.map((k) => (
          <div key={k.id} className="rounded border border-border bg-background/60 px-2 py-0.5 text-[10px] backdrop-blur-sm">
            <span className={k.attackerTeam === "A" ? TEAM_A_CLASS : TEAM_B_CLASS}>{k.attacker}</span>
            <span className="text-muted-foreground"> {k.weapon} </span>
            <span className="text-muted-foreground">{k.victim}</span>
          </div>
        ))}
      </div>

      {/* Faz etiketi */}
      {hud.phase === "buy" && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded border border-secondary/40 bg-background/60 px-3 py-1 text-center backdrop-blur-sm">
          <span className="font-mono text-sm text-secondary">HAZIRLIK - {hud.timer}s</span>
        </div>
      )}
      {hud.phase === "roundend" && hud.roundResult && (
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-lg border border-border bg-background/80 px-6 py-3 text-center backdrop-blur-md">
          <p className={`font-mono text-xl font-bold ${hud.roundResult === "A" ? TEAM_A_CLASS : TEAM_B_CLASS}`}>
            TUR BİTTİ
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {hud.roundResult === "A" ? "Mor" : "Turuncu"} takım kazandı
          </p>
        </div>
      )}

      {/* Crosshair + hit marker */}
      {hud.alive && hud.phase !== "roundend" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-6 w-6">
            {/* Crosshair */}
            <span className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-secondary/90" />
            <span className="absolute bottom-0 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-secondary/90" />
            <span className="absolute left-0 top-1/2 h-0.5 w-2 -translate-y-1/2 bg-secondary/90" />
            <span className="absolute right-0 top-1/2 h-0.5 w-2 -translate-y-1/2 bg-secondary/90" />
            
            {/* Hit marker animation */}
            {showHit && (
              <>
                <span className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse bg-primary" />
                <span className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse bg-primary" />
                {/* Hit marker corners */}
                <span className="absolute -left-2 -top-2 h-2 w-2 border-l-2 border-t-2 border-accent animate-pulse" />
                <span className="absolute -right-2 -top-2 h-2 w-2 border-r-2 border-t-2 border-accent animate-pulse" />
                <span className="absolute -left-2 -bottom-2 h-2 w-2 border-l-2 border-b-2 border-accent animate-pulse" />
                <span className="absolute -right-2 -bottom-2 h-2 w-2 border-r-2 border-b-2 border-accent animate-pulse" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Joystick */}
      <Joystick />

      {/* Sol üst: can + kalkan */}
      <div className="absolute bottom-6 left-44 w-36">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase text-muted-foreground">
          <span>CAN</span>
          <span className="text-foreground">{Math.ceil(hud.health)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-border bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-150"
            style={{ width: `${hpPct}%` }}
          />
        </div>
        {hud.shield > 0 && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full border border-secondary/40 bg-muted">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${shieldPct}%` }} />
          </div>
        )}
      </div>

      {/* Aksiyon butonları */}
      <ActionButton
        label="ATEŞ"
        className="absolute bottom-8 right-8 h-20 w-20 border-primary/60 bg-primary/20 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
        onDown={() => (controls.firing = true)}
        onUp={() => (controls.firing = false)}
      />
      <ActionButton
        label="ZIP"
        className="absolute bottom-32 right-10 h-14 w-14 border-secondary/60 bg-secondary/15 text-secondary"
        onDown={() => (controls.jumpQueued = true)}
      />
      <ActionButton
        label="DOLDUR"
        className="absolute bottom-8 right-32 h-14 w-14 border-border bg-background/70 text-foreground"
        onDown={() => (controls.reloadQueued = true)}
      />
      <ActionButton
        label={`BOMBA ${hud.grenades}`}
        className="absolute bottom-24 right-32 h-12 w-12 border-primary/40 bg-primary/10 text-primary disabled:opacity-40"
        onDown={() => (controls.grenadeQueued = true)}
      />

      {/* Şarjör göstergesi */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded border border-border bg-background/70 px-3 py-1 text-center backdrop-blur-sm">
        <div>
          <span className="font-mono text-lg font-bold text-foreground">{hud.ammo}</span>
          <span className="font-mono text-sm text-muted-foreground"> / {hud.reserve}</span>
          {hud.reloading && <span className="ml-2 animate-pulse font-mono text-xs text-secondary">DOLUYOR</span>}
        </div>
        <div className="font-mono text-[10px] uppercase text-muted-foreground">{weapon.name}</div>
      </div>

      {/* Öldü ekranı */}
      {!hud.alive && hud.phase === "live" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]">
              ELENDİN
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Sonraki tur bekleniyor...</p>
          </div>
        </div>
      )}

      {/* Buy Menu */}
      <BuyMenu />
    </div>
  )
}
