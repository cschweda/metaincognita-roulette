<template>
  <canvas
    ref="canvasRef"
    :width="size"
    :height="size"
    role="img"
    :aria-label="'Roulette wheel'"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { WHEEL_ORDER, colorOf, type Pocket } from '~/engine/wheel'

const props = withDefaults(defineProps<{
  variant: 'single' | 'double'
  reducedMotion?: boolean
  size?: number
  speed?: 'realistic' | 'quick'
}>(), {
  reducedMotion: false,
  size: 460,
  speed: 'realistic'
})

const emit = defineEmits<{
  settled: [pocket: Pocket]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Geometry constants (scaled from the v6 reference which used 560px for CX=280)
// We scale proportionally to props.size
const BASE = 560
function scale(v: number): number {
  return (v / BASE) * props.size
}

// v6 geometry (at BASE=560, CX=CY=280)
const R_RIM_BASE = 252
const R_TRACK_BASE = 232
const R_DIA_BASE = 198
const R_OUT_BASE = 176
const R_LBL_BASE = 150
const R_IN_BASE = 92
const R_CONE_BASE = 78
const R_REST_BASE = 126

const COL: Record<string, string> = { red: '#c1272d', black: '#1a1a1a', green: '#1b7a43' }

let raf: number | null = null
let isSpinning = false

function getCtx(): CanvasRenderingContext2D | null {
  return canvasRef.value?.getContext('2d') ?? null
}

function proj(R: number, a: number, lift = 0): [number, number] {
  const CX = props.size / 2
  const CY = props.size / 2
  return [CX + R * Math.cos(a), CY + R * Math.sin(a) - lift]
}

interface BallState {
  r: number
  a: number
  lift: number
}

function drawWheel(rotor: number, ball: BallState | null, win?: number): void {
  const ctx = getCtx()
  if (!ctx) return

  const CX = props.size / 2
  const CY = props.size / 2
  const R_RIM = scale(R_RIM_BASE)
  const R_TRACK = scale(R_TRACK_BASE)
  const R_DIA = scale(R_DIA_BASE)
  const R_OUT = scale(R_OUT_BASE)
  const R_LBL = scale(R_LBL_BASE)
  const R_IN = scale(R_IN_BASE)
  const R_CONE = scale(R_CONE_BASE)

  const order = WHEEL_ORDER[props.variant]
  const N = order.length
  const step = 2 * Math.PI / N

  ctx.clearRect(0, 0, props.size, props.size)
  ctx.save()

  // Wood rim
  const g = ctx.createLinearGradient(0, CY - R_RIM, 0, CY + R_RIM)
  g.addColorStop(0, '#5b3a20')
  g.addColorStop(0.5, '#794e2b')
  g.addColorStop(1, '#34200f')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(CX, CY, R_RIM, R_RIM, 0, 0, 2 * Math.PI)
  ctx.fill()

  // Dark ball track
  ctx.fillStyle = '#161616'
  ctx.beginPath()
  ctx.ellipse(CX, CY, R_TRACK, R_TRACK, 0, 0, 2 * Math.PI)
  ctx.fill()

  const tg = ctx.createLinearGradient(0, CY - R_TRACK, 0, CY + R_TRACK)
  tg.addColorStop(0, '#0c0c0c')
  tg.addColorStop(0.5, '#2a2a2a')
  tg.addColorStop(1, '#050505')
  ctx.strokeStyle = tg
  ctx.lineWidth = scale(14)
  ctx.beginPath()
  ctx.ellipse(CX, CY, (R_TRACK + R_DIA) / 2, (R_TRACK + R_DIA) / 2, 0, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.restore()

  // Colored pocket ring
  for (let i = 0; i < N; i++) {
    const a0 = rotor + i * step
    const a1 = a0 + step
    const n: Pocket = order[i]!
    ctx.beginPath()
    const p1 = proj(R_OUT, a0)
    const p2 = proj(R_OUT, a1)
    const p3 = proj(R_IN, a1)
    const p4 = proj(R_IN, a0)
    ctx.moveTo(p1[0], p1[1])
    ctx.lineTo(p2[0], p2[1])
    ctx.lineTo(p3[0], p3[1])
    ctx.lineTo(p4[0], p4[1])
    ctx.closePath()
    ctx.fillStyle = COL[colorOf(n)] ?? '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = 'rgba(212,168,71,.55)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Gold winner-glow on winning pocket
    if (win !== undefined && i === win) {
      ctx.save()
      ctx.lineWidth = 3.5
      ctx.strokeStyle = '#ffe08a'
      ctx.shadowColor = '#ffd86b'
      ctx.shadowBlur = 14
      ctx.stroke()
      ctx.restore()
    }

    // Pocket number label
    const mid = a0 + step / 2
    const lp = proj(R_LBL, mid)
    ctx.save()
    ctx.translate(lp[0], lp[1])
    ctx.fillStyle = '#fff'
    const fontSize = Math.round(scale(11))
    ctx.font = `700 ${fontSize}px Fira Code,monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), 0, 0)
    ctx.restore()
  }

  // Center cone with radial gradient
  const cg = ctx.createRadialGradient(CX - scale(14), CY - scale(16), scale(6), CX, CY, R_CONE)
  cg.addColorStop(0, '#e8e2cf')
  cg.addColorStop(0.4, '#b9a06a')
  cg.addColorStop(1, '#6b5226')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.ellipse(CX, CY, R_CONE, R_CONE, 0, 0, 2 * Math.PI)
  ctx.fill()

  // Dark inner circle
  ctx.fillStyle = '#3a2c12'
  ctx.beginPath()
  ctx.ellipse(CX, CY, scale(30), scale(30), 0, 0, 2 * Math.PI)
  ctx.fill()

  // Gold turret
  ctx.fillStyle = '#d4a847'
  ctx.beginPath()
  ctx.ellipse(CX, CY - scale(4), scale(12), scale(12), 0, 0, 2 * Math.PI)
  ctx.fill()

  // 8 diamonds
  for (let d = 0; d < 8; d++) {
    const a = d * Math.PI / 4 + Math.PI / 8
    const p = proj(R_DIA, a)
    const s = scale(8)
    ctx.save()
    ctx.translate(p[0], p[1])
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = '#cdbe8f'
    ctx.fillRect(-s / 2, -s / 2, s, s)
    ctx.strokeStyle = '#6b5a2a'
    ctx.strokeRect(-s / 2, -s / 2, s, s)
    ctx.restore()
  }

  // Ball
  if (ball) {
    const p = proj(ball.r, ball.a, ball.lift)
    const rad = scale(8.5)
    const sh = proj(ball.r, ball.a, 0)

    // Soft contact shadow
    const shg = ctx.createRadialGradient(sh[0], sh[1] + scale(4), 1, sh[0], sh[1] + scale(4), rad * 1.7)
    shg.addColorStop(0, 'rgba(0,0,0,.5)')
    shg.addColorStop(0.6, 'rgba(0,0,0,.28)')
    shg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = shg
    ctx.beginPath()
    ctx.ellipse(sh[0], sh[1] + scale(4), rad * 1.7, rad * 0.9, 0, 0, 2 * Math.PI)
    ctx.fill()

    // Sphere body (lit from upper-left, darker underside)
    const bg = ctx.createRadialGradient(p[0] - rad * 0.42, p[1] - rad * 0.46, rad * 0.12, p[0], p[1] + rad * 0.25, rad * 1.2)
    bg.addColorStop(0, '#ffffff')
    bg.addColorStop(0.45, '#ececea')
    bg.addColorStop(0.82, '#bcbcb5')
    bg.addColorStop(1, '#7c7c75')
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(p[0], p[1], rad, 0, 2 * Math.PI)
    ctx.fill()

    // Crisp specular highlight
    ctx.fillStyle = 'rgba(255,255,255,.95)'
    ctx.beginPath()
    ctx.ellipse(p[0] - rad * 0.36, p[1] - rad * 0.42, rad * 0.28, rad * 0.18, -0.6, 0, 2 * Math.PI)
    ctx.fill()
  }
}

function cancelSpin(): void {
  if (raf !== null) {
    cancelAnimationFrame(raf)
    raf = null
  }
}

function isReducedMotion(): boolean {
  if (props.reducedMotion) return true
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

function spinTo(pocket: Pocket): Promise<void> {
  // Ignore if already spinning
  if (isSpinning) return Promise.resolve()

  return new Promise<void>((resolve) => {
    cancelSpin()
    isSpinning = true

    const order = WHEEL_ORDER[props.variant]
    const N = order.length
    const step = 2 * Math.PI / N
    const R_REST = scale(R_REST_BASE)

    const targetIdx = order.indexOf(pocket)

    // Reduced motion: draw rest frame immediately and emit
    if (isReducedMotion()) {
      drawWheel(0, { a: (targetIdx + 0.5) * step, r: R_REST, lift: 0 }, targetIdx)
      emit('settled', pocket)
      isSpinning = false
      resolve()
      return
    }

    // Full animation — port of v6 spin(), but target is determined externally (targetIdx)
    const quick = props.speed === 'quick'
    const Ttot = quick ? 3.8 : 10.0
    const revs = (quick ? 4 : 7) + Math.floor(Math.random() * (quick ? 2 : 3)) // quick 4–5, realistic 7–9
    const ballDir = -1 // opposite the rotor
    const ballStart = Math.random() * 2 * Math.PI
    const A_final = Math.random() * 2 * Math.PI // ball rests at a random clock position
    const rotorW = 1.1 // rotor turns gently throughout
    // Backward-solve: given targetIdx and A_final, where must the rotor be at rest?
    // rotor_at_rest + (targetIdx+0.5)*step = A_final => rotor_at_rest = A_final - (targetIdx+0.5)*step
    const rotorAtRest = A_final - (targetIdx + 0.5) * step
    const rotorStart = rotorAtRest - rotorW * Ttot
    // PHI: total ball travel so it lands exactly at A_final
    const delta = ((ballDir * (A_final - ballStart)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const PHI = revs * 2 * Math.PI + delta

    const diamonds: number[] = []
    for (let d = 0; d < 8; d++) {
      diamonds.push(d * Math.PI / 4 + Math.PI / 8)
    }
    const R_TRACK = scale(R_TRACK_BASE)
    const easeOut = (x: number): number => 1 - Math.pow(1 - x, 2.2)
    const t0 = performance.now()

    function frame(now: number): void {
      const t = (now - t0) / 1000
      if (t >= Ttot) {
        drawWheel(rotorAtRest, { a: A_final, r: R_REST, lift: 0 }, targetIdx)
        emit('settled', pocket)
        isSpinning = false
        raf = null
        resolve()
        return
      }

      const x = t / Ttot
      const ballAngle = ballStart + ballDir * PHI * easeOut(x)
      const rotor = rotorStart + rotorW * t
      let r = R_TRACK
      let lift = 0

      if (x > 0.6) {
        // Leave the track, drop into the pockets
        const k = (x - 0.6) / 0.4
        const ke = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        r = R_TRACK + (R_REST - R_TRACK) * ke
        lift = -9 * Math.sin(Math.min(1, k) * Math.PI)
        // Diamond rattle — radius wobble plus a small vertical hop, so the ball
        // visibly clatters as it bumps over each deflector (a touch more obvious).
        for (const da of diamonds) {
          const dd = Math.abs(Math.atan2(Math.sin(ballAngle - da), Math.cos(ballAngle - da)))
          if (dd < 0.15 && k < 0.88) {
            const clatter = Math.sin(t * 55)
            r += 4.6 * clatter
            lift += 4 * Math.abs(clatter)
          }
        }
      }

      drawWheel(rotor, { a: ballAngle, r, lift })
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
  })
}

defineExpose({ spinTo })

onMounted(() => {
  drawWheel(0, null)
})

onUnmounted(() => {
  cancelSpin()
})

// Redraw idle wheel when variant changes
watch(() => props.variant, () => {
  cancelSpin()
  isSpinning = false
  drawWheel(0, null)
})
</script>
