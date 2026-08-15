'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngine } from './game-context'

const UP = new THREE.Vector3(0, 1, 0)
const q = new THREE.Quaternion()
const dir = new THREE.Vector3()

export function Effects() {
  const engine = useEngine()
  const tracers = useRef<THREE.Group>(null)
  const flashes = useRef<THREE.Group>(null)
  const sparks = useRef<THREE.Group>(null)
  const explosions = useRef<THREE.Group>(null)
  const grenades = useRef<THREE.Group>(null)

  useFrame(() => {
    // tracer'lar
    if (tracers.current) {
      const kids = tracers.current.children as THREE.Mesh[]
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i]
        const tr = engine.tracers[i]
        if (!tr) { m.visible = false; continue }
        m.visible = true
        dir.subVectors(tr.to, tr.from)
        const len = dir.length()
        dir.normalize()
        q.setFromUnitVectors(UP, dir)
        m.quaternion.copy(q)
        m.position.copy(tr.from).addScaledVector(dir, len / 2)
        m.scale.set(1, len, 1)
        const mat = m.material as THREE.MeshBasicMaterial
        mat.color.set(tr.color)
        mat.opacity = Math.max(0, 1 - tr.t / tr.life)
      }
    }
    // namlu alevleri
    if (flashes.current) {
      const kids = flashes.current.children as THREE.Mesh[]
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i]
        const f = engine.flashes[i]
        if (!f) { m.visible = false; continue }
        m.visible = true
        m.position.copy(f.pos)
        const s = 0.5 * (1 - f.t / f.life) + 0.2
        m.scale.setScalar(s)
        ;(m.material as THREE.MeshBasicMaterial).color.set(f.color)
      }
    }
    // kıvılcımlar
    if (sparks.current) {
      const kids = sparks.current.children as THREE.Mesh[]
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i]
        const s = engine.sparks[i]
        if (!s) { m.visible = false; continue }
        m.visible = true
        m.position.copy(s.pos)
        m.scale.setScalar(0.3 * (1 - s.t / s.life) + 0.05)
      }
    }
    // patlamalar
    if (explosions.current) {
      const kids = explosions.current.children as THREE.Mesh[]
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i]
        const e = engine.explosions[i]
        if (!e) { m.visible = false; continue }
        m.visible = true
        m.position.copy(e.pos)
        const p = e.t / e.life
        m.scale.setScalar(0.5 + p * 6)
        ;(m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - p)
      }
    }
    // el bombaları
    if (grenades.current) {
      const kids = grenades.current.children as THREE.Mesh[]
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i]
        const g = engine.grenades[i]
        if (!g) { m.visible = false; continue }
        m.visible = true
        m.position.copy(g.pos)
        m.rotation.x += 0.3
        m.rotation.y += 0.2
      }
    }
  })

  return (
    <group>
      <group ref={tracers}>
        {Array.from({ length: 48 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
            <meshBasicMaterial transparent color="#a855f7" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={flashes}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial transparent color="#ffffff" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={sparks}>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#fef08a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={explosions}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial transparent color="#f97316" toneMapped={false} opacity={1} />
          </mesh>
        ))}
      </group>
      <group ref={grenades}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#84cc16" emissive="#84cc16" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
