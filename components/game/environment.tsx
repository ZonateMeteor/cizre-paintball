'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { MapDef } from '@/lib/game/maps'

export function Environment({ map }: { map: MapDef }) {
  const gridTexture = useMemo(() => makeGrid(map.groundEmissive), [map.groundEmissive])

  return (
    <group>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={[map.accentA, map.ground, 0.4]} />
      <directionalLight position={[10, 20, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 10, 0]} intensity={40} distance={60} color={map.accentA} />
      <pointLight position={[-map.half * 0.7, 6, -map.half * 0.7]} intensity={25} distance={40} color={map.accentB} />
      <pointLight position={[map.half * 0.7, 6, map.half * 0.7]} intensity={25} distance={40} color={map.accentA} />

      {/* zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[map.half * 2, map.half * 2]} />
        <meshStandardMaterial
          color={map.ground}
          emissive={map.groundEmissive}
          emissiveIntensity={0.25}
          metalness={0.6}
          roughness={0.4}
          map={gridTexture}
        />
      </mesh>

      {/* neon zemin ızgarası çizgileri (takım renkleri) */}
      <gridHelper args={[map.half * 2, map.half, map.accentA, map.accentB]} position={[0, 0.02, 0]}>
        <meshBasicMaterial attach="material" transparent opacity={0.15} />
      </gridHelper>

      {/* bloklar */}
      {map.blocks.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.emissive ?? b.color}
            emissiveIntensity={b.emissiveIntensity ?? 0.3}
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* base bölge işaretleri */}
      <BaseMarker pos={centerOf(map.spawnsA)} color={map.accentA} />
      <BaseMarker pos={centerOf(map.spawnsB)} color={map.accentB} />
    </group>
  )
}

function centerOf(spawns: [number, number][]): [number, number] {
  const x = spawns.reduce((s, p) => s + p[0], 0) / spawns.length
  const z = spawns.reduce((s, p) => s + p[1], 0) / spawns.length
  return [x, z]
}

function BaseMarker({ pos, color }: { pos: [number, number]; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.03, pos[1]]}>
      <ringGeometry args={[3.2, 3.6, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

function makeGrid(color: string): THREE.Texture {
  if (typeof document === 'undefined') {
    const data = new Uint8Array([0, 0, 0, 255])
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat)
    tex.needsUpdate = true
    return tex
  }

  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  ctx.strokeRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(24, 24)
  return tex
}
