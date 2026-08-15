'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { GameContext } from './game-context'
import { Environment } from './environment'
import { Combatants } from './combatants'
import { Effects } from './effects'
import { PlayerController } from './player-controller'
import { WeaponViewmodel } from './weapon-viewmodel'
import type { GameEngine } from '@/lib/game/engine'

function EngineDriver({ engine }: { engine: GameEngine }) {
  useFrame((_, dt) => {
    engine.update(dt)
  })
  return null
}

export function GameCanvas({ engine }: { engine: GameEngine }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.6, 0] }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color(engine.map.sky)
        scene.fog = new THREE.Fog(engine.map.fog, engine.map.fogNear, engine.map.fogFar)
      }}
    >
      <GameContext.Provider value={engine}>
        <EngineDriver engine={engine} />
        <Environment map={engine.map} />
        <Combatants />
        <Effects />
        <PlayerController onWeaponEvent={() => {}} />
        <WeaponViewmodel />
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.3} mipmapBlur radius={0.6} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      </GameContext.Provider>
    </Canvas>
  )
}
