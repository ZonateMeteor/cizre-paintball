'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngine } from './game-context'
import { controls } from '@/lib/game/store'
import { WEAPONS, PLAYER } from '@/lib/game/config'
import * as SFX from '@/lib/game/sound'

export function PlayerController({ onWeaponEvent }: { onWeaponEvent: (e: 'shoot' | 'reload') => void }) {
  const engine = useEngine()
  const { camera } = useThree()
  const velY = useRef(0)
  const wasFiring = useRef(false)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const l = engine.local
    if (!l) return
    const now = performance.now() / 1000
    const w = WEAPONS[l.weapon]

    // --- bakış ---
    l.yaw -= controls.lookDX * 0.004
    l.pitch -= controls.lookDY * 0.004
    l.pitch = Math.max(-1.3, Math.min(1.3, l.pitch))
    controls.lookDX = 0
    controls.lookDY = 0

    // --- hareket (buy fazında base'de kilitli) ---
    if (l.alive && engine.phase === 'live') {
      forward.current.set(-Math.sin(l.yaw), 0, -Math.cos(l.yaw))
      right.current.set(Math.cos(l.yaw), 0, -Math.sin(l.yaw))
      const move = new THREE.Vector3()
      move.addScaledVector(forward.current, -controls.moveY)
      move.addScaledVector(right.current, controls.moveX)
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(PLAYER.moveSpeed * dt)
        const nx = l.pos.x + move.x
        if (!engine.isBlocked(nx, l.pos.z) && Math.abs(nx) < engine.map.half - 1) l.pos.x = nx
        const nz = l.pos.z + move.z
        if (!engine.isBlocked(l.pos.x, nz) && Math.abs(nz) < engine.map.half - 1) l.pos.z = nz
        SFX.playStep()
      }
    }

    // --- zıplama & yerçekimi ---
    const ground = engine.groundHeightAt(l.pos.x, l.pos.z)
    const onGround = l.pos.y <= ground + 0.02
    if (controls.jumpQueued && onGround && l.alive && engine.phase === 'live') {
      velY.current = PLAYER.jumpForce
    }
    controls.jumpQueued = false
    velY.current -= 18 * dt
    l.pos.y += velY.current * dt
    if (l.pos.y <= ground) {
      l.pos.y = ground
      velY.current = 0
    }

    // --- kamera ---
    camera.rotation.order = 'YXZ'
    camera.rotation.set(l.pitch, l.yaw, 0)
    camera.position.set(l.pos.x, l.pos.y + PLAYER.eyeHeight, l.pos.z)
    // sarsıntı
    if (engine.shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * engine.shake * 0.15
      camera.position.y += (Math.random() - 0.5) * engine.shake * 0.15
    }

    // --- şarjör doldurma ---
    const reloading = now < l.reloadUntil
    if (controls.reloadQueued && !reloading && l.ammo < w.magazine && l.reserve > 0 && l.alive) {
      l.reloadUntil = now + w.reloadTime
      SFX.playReload()
      onWeaponEvent('reload')
    }
    controls.reloadQueued = false
    if (reloading && now + dt >= l.reloadUntil) {
      // yeni tamamlandı
      const need = w.magazine - l.ammo
      const take = Math.min(need, l.reserve)
      l.reserve -= take
      l.ammo += take
      engine.syncLocalHud()
    }

    // --- el bombası ---
    if (controls.grenadeQueued && l.alive && engine.phase === 'live' && l.grenades > 0) {
      const eye = new THREE.Vector3(l.pos.x, l.pos.y + PLAYER.eyeHeight, l.pos.z)
      const d = new THREE.Vector3()
      camera.getWorldDirection(d)
      engine.throwGrenade(l, eye, d)
    }
    controls.grenadeQueued = false

    // --- ateş ---
    const canShoot =
      l.alive &&
      engine.phase === 'live' &&
      !reloading &&
      now - l.lastShotAt >= 1 / w.fireRate
    const wantShoot = w.auto ? controls.firing : controls.firing && !wasFiring.current
    if (controls.firing && !canShoot && l.ammo <= 0 && !reloading && !wasFiring.current) {
      SFX.playEmpty()
    }
    if (wantShoot && canShoot) {
      if (l.ammo <= 0) {
        // otomatik reload tetikle
        if (l.reserve > 0) {
          l.reloadUntil = now + w.reloadTime
          SFX.playReload()
          onWeaponEvent('reload')
        } else {
          SFX.playEmpty()
        }
      } else {
        l.lastShotAt = now
        l.ammo--
        const eye = new THREE.Vector3(l.pos.x, l.pos.y + PLAYER.eyeHeight, l.pos.z)
        const base = new THREE.Vector3()
        camera.getWorldDirection(base)
        for (let p = 0; p < w.pellets; p++) {
          const d = base.clone()
          d.x += (Math.random() - 0.5) * w.spread * 2
          d.y += (Math.random() - 0.5) * w.spread * 2
          d.z += (Math.random() - 0.5) * w.spread * 2
          d.normalize()
          engine.shootHitscan(l, eye, d)
        }
        engine.flashes.push({
          pos: eye.clone().addScaledVector(base, 0.8),
          color: w.color,
          t: 0,
          life: 0.05,
        })
        engine.shake = Math.min(1.2, engine.shake + w.recoil * 0.12)
        l.pitch = Math.max(-1.3, l.pitch + w.recoil * 0.004)
        SFX.playShot(l.weapon)
        onWeaponEvent('shoot')
        engine.syncLocalHud()
      }
    }
    wasFiring.current = controls.firing
  })

  return null
}
