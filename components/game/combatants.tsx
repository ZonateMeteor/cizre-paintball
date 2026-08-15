'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useEngine } from './game-context'
import type { Combatant } from '@/lib/game/engine'
import { PLAYER } from '@/lib/game/config'

export function Combatants() {
  const engine = useEngine()
  const ids = Array.from(engine.combatants.keys())
  return (
    <group>
      {ids.map((id) => (
        <CombatantMesh key={id} id={id} />
      ))}
    </group>
  )
}

function CombatantMesh({ id }: { id: string }) {
  const engine = useEngine()
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Mesh>(null)
  const bar = useRef<THREE.Mesh>(null)
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null)

  const c = engine.combatants.get(id)!
  const isLocal = c.isLocal
  const teamColor = c.team === 'A' ? engine.map.accentA : engine.map.accentB

  useFrame(() => {
    const cc = engine.combatants.get(id)
    if (!group.current || !cc) return
    // yerel oyuncunun kendi gövdesi görünmez (birinci şahıs)
    const visible = cc.alive && !isLocal
    group.current.visible = visible
    if (!visible) return
    group.current.position.set(cc.pos.x, cc.pos.y, cc.pos.z)
    group.current.rotation.y = cc.yaw
    // hasar flaşı
    if (bodyMat.current) {
      bodyMat.current.emissiveIntensity = cc.hitFlash > 0 ? 2.5 : 0.9
    }
    // can barı ölçek
    if (bar.current) {
      const ratio = Math.max(0, cc.health / PLAYER.maxHealth)
      bar.current.scale.x = ratio
      bar.current.position.x = -(1 - ratio) * 0.5
      ;(bar.current.material as THREE.MeshBasicMaterial).color.set(
        ratio > 0.5 ? '#22d3ee' : ratio > 0.25 ? '#f59e0b' : '#ef4444',
      )
    }
  })

  return (
    <group ref={group}>
      {/* gövde */}
      <mesh ref={body} position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.7, 4, 12]} />
        <meshStandardMaterial
          ref={bodyMat}
          color={c.color}
          emissive={c.color}
          emissiveIntensity={0.9}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      {/* baş */}
      <mesh ref={head} position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#0a0a12" emissive={c.color} emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* vizör (bakış yönü) */}
      <mesh position={[0, 1.45, 0.21]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshBasicMaterial color={teamColor} />
      </mesh>
      {/* omuz ışıkları */}
      <mesh position={[0.34, 1.05, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color={teamColor} />
      </mesh>
      <mesh position={[-0.34, 1.05, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color={teamColor} />
      </mesh>
      {/* takım halkası */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.42, 0.55, 24]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* isim + can barı */}
      <Billboard position={[0, 2.1, 0]}>
        <Text fontSize={0.28} color={teamColor} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#000000">
          {c.username}
        </Text>
        <mesh position={[0, -0.28, 0]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
        <mesh ref={bar} position={[0, -0.28, 0.01]}>
          <planeGeometry args={[1, 0.08]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </Billboard>
    </group>
  )
}
