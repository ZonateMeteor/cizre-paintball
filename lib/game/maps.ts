export type Block = {
  pos: [number, number, number]
  size: [number, number, number]
  color: string
  emissive?: string
  emissiveIntensity?: number
}

export type MapDef = {
  id: string
  name: string
  blocks: Block[]
  spawnsA: [number, number][]
  spawnsB: [number, number][]
  fog: string
  fogNear: number
  fogFar: number
  ground: string
  groundEmissive: string
  sky: string
  half: number // yarım boyut (kare arena yarı kenar)
  accentA: string
  accentB: string
}

function wall(pos: [number, number, number], size: [number, number, number], color: string, em?: string, ei = 0.4): Block {
  return { pos, size, color, emissive: em, emissiveIntensity: ei }
}

// Çevre duvarları üreten yardımcı
function perimeter(half: number, h: number, color: string, em: string): Block[] {
  const t = 1
  return [
    wall([0, h / 2, -half], [half * 2, h, t], color, em, 0.5),
    wall([0, h / 2, half], [half * 2, h, t], color, em, 0.5),
    wall([-half, h / 2, 0], [t, h, half * 2], color, em, 0.5),
    wall([half, h / 2, 0], [t, h, half * 2], color, em, 0.5),
  ]
}

const NEON_P = '#a855f7'
const NEON_C = '#22d3ee'

// --- Neon District: dar sokaklar, yakın çatışma ---
const neonDistrict: MapDef = {
  id: 'neon_district',
  name: 'Neon District',
  half: 24,
  fog: '#0a0612',
  fogNear: 10,
  fogFar: 70,
  ground: '#0e0a1a',
  groundEmissive: '#1a0f2e',
  sky: '#120a20',
  accentA: NEON_P,
  accentB: NEON_C,
  spawnsA: [[-19, -19], [-16, -19], [-19, -16], [-13, -19]],
  spawnsB: [[19, 19], [16, 19], [19, 16], [13, 19]],
  blocks: [
    ...perimeter(24, 5, '#1a1130', NEON_P),
    // merkez binalar
    wall([0, 2, 0], [6, 4, 6], '#161029', NEON_C, 0.3),
    wall([-10, 1.5, -4], [4, 3, 8], '#161029', NEON_P, 0.3),
    wall([10, 1.5, 4], [4, 3, 8], '#161029', NEON_C, 0.3),
    wall([-6, 1, 10], [8, 2, 3], '#161029', NEON_P, 0.3),
    wall([6, 1, -10], [8, 2, 3], '#161029', NEON_C, 0.3),
    // sandıklar (siper)
    wall([4, 0.7, 8], [1.6, 1.4, 1.6], '#20143a', NEON_C, 0.6),
    wall([-4, 0.7, -8], [1.6, 1.4, 1.6], '#20143a', NEON_P, 0.6),
    wall([12, 0.7, -8], [1.6, 1.4, 1.6], '#20143a', NEON_P, 0.6),
    wall([-12, 0.7, 8], [1.6, 1.4, 1.6], '#20143a', NEON_C, 0.6),
    wall([0, 0.7, -14], [3, 1.4, 1.4], '#20143a', NEON_P, 0.6),
    wall([0, 0.7, 14], [3, 1.4, 1.4], '#20143a', NEON_C, 0.6),
    // yükseltilmiş platform
    wall([-16, 0.5, 6], [5, 1, 5], '#1c1233', NEON_P, 0.4),
    wall([16, 0.5, -6], [5, 1, 5], '#1c1233', NEON_C, 0.4),
  ],
}

// --- Cyber Dome: simetrik arena, orta mesafe ---
const cyberDome: MapDef = {
  id: 'cyber_dome',
  name: 'Cyber Dome',
  half: 22,
  fog: '#04101a',
  fogNear: 12,
  fogFar: 75,
  ground: '#07141f',
  groundEmissive: '#0a2436',
  sky: '#06121d',
  accentA: NEON_C,
  accentB: NEON_P,
  spawnsA: [[0, -18], [-3, -18], [3, -18], [0, -15]],
  spawnsB: [[0, 18], [-3, 18], [3, 18], [0, 15]],
  blocks: [
    ...perimeter(22, 5, '#0c2233', NEON_C),
    // merkez ring
    wall([0, 1, 0], [4, 2, 4], '#0d2130', NEON_P, 0.5),
    wall([-8, 1.2, 0], [2, 2.4, 6], '#0d2130', NEON_C, 0.4),
    wall([8, 1.2, 0], [2, 2.4, 6], '#0d2130', NEON_C, 0.4),
    wall([0, 1.2, -8], [6, 2.4, 2], '#0d2130', NEON_P, 0.4),
    wall([0, 1.2, 8], [6, 2.4, 2], '#0d2130', NEON_P, 0.4),
    // köşe siperleri
    wall([-13, 0.8, -10], [3, 1.6, 3], '#123049', NEON_C, 0.6),
    wall([13, 0.8, -10], [3, 1.6, 3], '#123049', NEON_C, 0.6),
    wall([-13, 0.8, 10], [3, 1.6, 3], '#123049', NEON_P, 0.6),
    wall([13, 0.8, 10], [3, 1.6, 3], '#123049', NEON_P, 0.6),
    wall([-6, 0.6, -14], [2, 1.2, 2], '#123049', NEON_C, 0.6),
    wall([6, 0.6, 14], [2, 1.2, 2], '#123049', NEON_P, 0.6),
  ],
}

// --- Reactor Core: çok katlı, dikey ---
const reactorCore: MapDef = {
  id: 'reactor_core',
  name: 'Reactor Core',
  half: 22,
  fog: '#12060a',
  fogNear: 10,
  fogFar: 70,
  ground: '#160a10',
  groundEmissive: '#2a0f1a',
  sky: '#1a0a12',
  accentA: NEON_P,
  accentB: '#f97316',
  spawnsA: [[-18, -18], [-15, -18], [-18, -15], [-12, -18]],
  spawnsB: [[18, 18], [15, 18], [18, 15], [12, 18]],
  blocks: [
    ...perimeter(22, 6, '#2a1420', NEON_P),
    // merkez reaktör
    wall([0, 2.5, 0], [5, 5, 5], '#22101a', '#f97316', 0.5),
    // katman platformları
    wall([-8, 0.5, -8], [6, 1, 6], '#1e0f18', NEON_P, 0.4),
    wall([8, 0.5, 8], [6, 1, 6], '#1e0f18', '#f97316', 0.4),
    wall([-8, 1.5, 8], [6, 1, 6], '#1e0f18', '#f97316', 0.4),
    wall([8, 1.5, -8], [6, 1, 6], '#1e0f18', NEON_P, 0.4),
    // rampalar (basamak)
    wall([-4, 0.3, -12], [3, 0.6, 3], '#1e0f18', NEON_P, 0.3),
    wall([4, 0.9, -12], [3, 0.6, 3], '#1e0f18', NEON_P, 0.3),
    wall([4, 0.3, 12], [3, 0.6, 3], '#1e0f18', '#f97316', 0.3),
    wall([-4, 0.9, 12], [3, 0.6, 3], '#1e0f18', '#f97316', 0.3),
    // siperler
    wall([-14, 0.7, 2], [1.4, 1.4, 4], '#301522', NEON_P, 0.6),
    wall([14, 0.7, -2], [1.4, 1.4, 4], '#301522', '#f97316', 0.6),
  ],
}

// --- Grid Harbor: açık, uzun hatlar ---
const gridHarbor: MapDef = {
  id: 'grid_harbor',
  name: 'Grid Harbor',
  half: 28,
  fog: '#04121a',
  fogNear: 16,
  fogFar: 95,
  ground: '#06151e',
  groundEmissive: '#0a2a3a',
  sky: '#05121c',
  accentA: NEON_C,
  accentB: NEON_P,
  spawnsA: [[-23, -23], [-20, -23], [-23, -20], [-17, -23]],
  spawnsB: [[23, 23], [20, 23], [23, 20], [17, 23]],
  blocks: [
    ...perimeter(28, 5, '#0a2231', NEON_C),
    // konteynerler (uzun hatlar)
    wall([-6, 1.25, -6], [10, 2.5, 3], '#0c2434', NEON_P, 0.4),
    wall([6, 1.25, 6], [10, 2.5, 3], '#0c2434', NEON_C, 0.4),
    wall([-12, 1.25, 8], [3, 2.5, 8], '#0c2434', NEON_C, 0.4),
    wall([12, 1.25, -8], [3, 2.5, 8], '#0c2434', NEON_P, 0.4),
    wall([0, 1.75, 0], [4, 3.5, 4], '#0c2434', NEON_P, 0.3),
    // iskele siperleri
    wall([-18, 0.7, 0], [2, 1.4, 4], '#103148', NEON_C, 0.6),
    wall([18, 0.7, 0], [2, 1.4, 4], '#103148', NEON_P, 0.6),
    wall([0, 0.7, -18], [4, 1.4, 2], '#103148', NEON_C, 0.6),
    wall([0, 0.7, 18], [4, 1.4, 2], '#103148', NEON_P, 0.6),
    wall([-20, 0.5, 14], [4, 1, 4], '#0c2434', NEON_C, 0.4),
    wall([20, 0.5, -14], [4, 1, 4], '#0c2434', NEON_P, 0.4),
  ],
}

export const MAPS: Record<string, MapDef> = {
  neon_district: neonDistrict,
  cyber_dome: cyberDome,
  reactor_core: reactorCore,
  grid_harbor: gridHarbor,
}

export function getMap(id: string): MapDef {
  return MAPS[id] ?? neonDistrict
}

// Yatay (xz) katı engeller - bot navigasyonu ve mermi occlusion için
export function solidBlocks(map: MapDef): Block[] {
  return map.blocks.filter((b) => b.size[1] >= 1.2)
}
