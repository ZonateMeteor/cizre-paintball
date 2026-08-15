'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngine } from './game-context'
import { controls } from '@/lib/game/store'
import { WEAPONS } from '@/lib/game/config'

const offset = new THREE.Vector3()
const baseOffset = new THREE.Vector3(0.24, -0.22, -0.5)

export function WeaponViewmodel() {
  const engine = useEngine()
  const { camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const muzzle = useRef<THREE.Mesh>(null)
  const lastShot = useRef(0)
  const recoil = useRef(0)
  const bob = useRef(0)

  const local = engine.local

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const l = engine.local
    if (!group.current || !l) return
    const now = performance.now() / 1000
    const w = WEAPONS[l.weapon]

    group.current.visible = l.alive

    // konum: kamera yerel uzayında sabit offset
    offset.copy(baseOffset)
    // yürüme sallanması
    if ((controls.moveX !== 0 || controls.moveY !== 0) && engine.phase === 'live') {
      bob.current += dt * 10
    }
    const bobY = Math.sin(bob.current) * 0.012
    const bobX = Math.cos(bob.current * 0.5) * 0.012
    offset.x += bobX
    offset.y += bobY

    // ateş geri tepmesi
    if (l.lastShotAt !== lastShot.current) {
      lastShot.current = l.lastShotAt
      recoil.current = Math.min(1, recoil.current + 0.6)
    }
    recoil.current = Math.max(0, recoil.current - dt * 6)
    offset.z += recoil.current * 0.12

    // reload eğilme
    const reloading = now < l.reloadUntil
    let reloadRot = 0
    if (reloading) {
      const w2 = WEAPONS[l.weapon]
      const p = 1 - (l.reloadUntil - now) / w2.reloadTime
      reloadRot = Math.sin(p * Math.PI) * 0.9
      offset.y -= Math.sin(p * Math.PI) * 0.15
    }

    offset.applyQuaternion(camera.quaternion)
    group.current.position.copy(camera.position).add(offset)
    group.current.quaternion.copy(camera.quaternion)
    group.current.rotateX(reloadRot + recoil.current * 0.15)
    group.current.rotateZ(reloading ? Math.sin(now * 20) * 0.05 : 0)

    // namlu alevi
    if (muzzle.current) {
      const since = now - l.lastShotAt
      const on = since < 0.05 && l.alive
      muzzle.current.visible = on
      if (on) {
        muzzle.current.scale.setScalar(0.6 + Math.random() * 0.5)
        ;(muzzle.current.material as THREE.MeshBasicMaterial).color.set(w.color)
      }
    }
  })

  const dims = useMemo(() => weaponDims(local?.weapon ?? 'pistol'), [local?.weapon])
  const color = WEAPONS[local?.weapon ?? 'pistol'].color

  return (
    <group ref={group}>
      {/* gövde */}
      <mesh position={[0, 0, dims.bodyZ]}>
        <boxGeometry args={[dims.w, dims.h, dims.len]} />
        <meshStandardMaterial color="#12101a" emissive={color} emissiveIntensity={0.35} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* namlu */}
      <mesh position={[0, dims.h * 0.1, dims.bodyZ - dims.len / 2 - dims.barrel / 2]}>
        <boxGeometry args={[dims.w * 0.4, dims.h * 0.4, dims.barrel]} />
        <meshStandardMaterial color="#0a0812" emissive={color} emissiveIntensity={0.6} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* şarjör */}
      <mesh position={[0, -dims.h * 0.7, dims.bodyZ + dims.len * 0.1]}>
        <boxGeometry args={[dims.w * 0.6, dims.h * 1.1, dims.len * 0.22]} />
        <meshStandardMaterial color="#1a1626" emissive={color} emissiveIntensity={0.4} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* neon şerit */}
      <mesh position={[dims.w * 0.51, 0, dims.bodyZ]}>
        <boxGeometry args={[0.01, dims.h * 0.5, dims.len * 0.7]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* namlu alevi */}
      <mesh ref={muzzle} position={[0, dims.h * 0.1, dims.bodyZ - dims.len / 2 - dims.barrel]} visible={false}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function weaponDims(weapon: string) {
  switch (weapon) {
    case 'sniper':
      return { w: 0.09, h: 0.11, len: 0.7, barrel: 0.5, bodyZ: 0, bodyOffset: 0 }
    case 'rifle':
      return { w: 0.1, h: 0.12, len: 0.5, barrel: 0.32, bodyZ: 0, bodyOffset: 0 }
    case 'shotgun':
      return { w: 0.13, h: 0.14, len: 0.48, barrel: 0.3, bodyZ: 0, bodyOffset: 0 }
    case 'smg':
      return { w: 0.1, h: 0.13, len: 0.34, barrel: 0.2, bodyZ: 0, bodyOffset: 0 }
    default:
      return { w: 0.08, h: 0.12, len: 0.22, barrel: 0.12, bodyZ: 0, bodyOffset: 0 }
  }
}
