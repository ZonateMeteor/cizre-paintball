// Web Audio ile prosedürel ses motoru - harici dosya gerektirmez.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  return ctx
}

export function resumeAudio() {
  const c = ac()
  if (c && c.state === 'suspended') c.resume()
}

export function setAudioEnabled(v: boolean) {
  enabled = v
  if (master) master.gain.value = v ? 0.5 : 0
}

function noiseBuffer(c: AudioContext, dur: number) {
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function env(c: AudioContext, node: GainNode, peak: number, attack: number, decay: number) {
  const t = c.currentTime
  node.gain.cancelScheduledValues(t)
  node.gain.setValueAtTime(0.0001, t)
  node.gain.exponentialRampToValueAtTime(peak, t + attack)
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

export function playShot(weapon: string) {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime

  // Weapon-specific base frequency
  const weaponParams: Record<string, { freq: number; duration: number; noise: number }> = {
    pistol: { freq: 160, duration: 0.14, noise: 0.5 },
    deagle: { freq: 140, duration: 0.20, noise: 0.7 },
    smg: { freq: 140, duration: 0.10, noise: 0.4 },
    uzi: { freq: 150, duration: 0.09, noise: 0.4 },
    rifle: { freq: 130, duration: 0.16, noise: 0.55 },
    ak47: { freq: 125, duration: 0.18, noise: 0.60 },
    shotgun: { freq: 60, duration: 0.25, noise: 0.8 },
    pump: { freq: 65, duration: 0.28, noise: 0.85 },
    sniper: { freq: 90, duration: 0.35, noise: 0.7 },
    laser: { freq: 200, duration: 0.12, noise: 0.3 },
    knife: { freq: 800, duration: 0.08, noise: 0.2 },
  }

  const params = weaponParams[weapon] || { freq: 130, duration: 0.14, noise: 0.5 }

  // düşük gövde (patlama)
  const osc = c.createOscillator()
  const og = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(params.freq, t)
  osc.frequency.exponentialRampToValueAtTime(params.freq * 0.4, t + params.duration)
  env(c, og, 0.6, 0.001, params.duration)
  osc.connect(og).connect(master)
  osc.start(t)
  osc.stop(t + params.duration + 0.1)

  // kırbaç (yüksek frekans gürültü)
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, params.duration * 0.8)
  const ng = c.createGain()
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = weapon === 'smg' || weapon === 'uzi' ? 1800 : weapon === 'laser' ? 2400 : 1200
  env(c, ng, params.noise, 0.001, params.duration * 0.6)
  src.connect(hp).connect(ng).connect(master)
  src.start(t)
  src.stop(t + params.duration)
}

export function playReload() {
  const c = ac()
  if (!c || !master || !enabled) return
  const clicks = [0, 0.18, 0.55, 0.9]
  clicks.forEach((d, i) => {
    const t = c.currentTime + d
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, 0.05)
    const g = c.createGain()
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 800 + i * 400
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    src.connect(bp).connect(g).connect(master!)
    src.start(t)
    src.stop(t + 0.1)
  })
}

export function playExplosion() {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.8)
  const g = c.createGain()
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(1200, t)
  lp.frequency.exponentialRampToValueAtTime(120, t + 0.6)
  g.gain.setValueAtTime(0.9, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  src.connect(lp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.9)

  const osc = c.createOscillator()
  const og = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.5)
  env(c, og, 0.8, 0.002, 0.6)
  osc.connect(og).connect(master)
  osc.start(t)
  osc.stop(t + 0.7)
}

export function playHit() {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1400, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08)
  env(c, g, 0.35, 0.001, 0.08)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.15)
}

export function playHurt() {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.25)
  const g = c.createGain()
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 500
  env(c, g, 0.4, 0.002, 0.2)
  src.connect(bp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.3)
}

export function playEmpty() {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.04)
  const g = c.createGain()
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000
  env(c, g, 0.25, 0.001, 0.04)
  src.connect(hp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.08)
}

export function playThrow() {
  const c = ac()
  if (!c || !master || !enabled) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.15)
  env(c, g, 0.3, 0.005, 0.15)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.25)
}

export function playRoundStart() {
  const c = ac()
  if (!c || !master || !enabled) return
  ;[440, 660, 880].forEach((f, i) => {
    const t = c.currentTime + i * 0.12
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    env(c, g, 0.25, 0.01, 0.2)
    osc.connect(g).connect(master!)
    osc.start(t)
    osc.stop(t + 0.25)
  })
}

export function playWin() {
  const c = ac()
  if (!c || !master || !enabled) return
  ;[523, 659, 784, 1046].forEach((f, i) => {
    const t = c.currentTime + i * 0.14
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    env(c, g, 0.3, 0.01, 0.25)
    osc.connect(g).connect(master!)
    osc.start(t)
    osc.stop(t + 0.3)
  })
}

export function playLose() {
  const c = ac()
  if (!c || !master || !enabled) return
  ;[440, 349, 262].forEach((f, i) => {
    const t = c.currentTime + i * 0.16
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    env(c, g, 0.28, 0.01, 0.3)
    osc.connect(g).connect(master!)
    osc.start(t)
    osc.stop(t + 0.35)
  })
}

let lastStep = 0
export function playStep() {
  const c = ac()
  if (!c || !master || !enabled) return
  const now = performance.now()
  if (now - lastStep < 320) return
  lastStep = now
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.08)
  const g = c.createGain()
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 400
  env(c, g, 0.12, 0.002, 0.06)
  src.connect(lp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.12)
}
