// Generates public/og-image.svg using the Metaincognita branded background system
// (guidelines v1.1 §6): navy diagonal gradient, fine + major grids, dot overlay, radial
// vignette, corner registration marks, bottom rule with the letterspaced METAINCOGNITA
// wordmark, a game-accent bar, a game-specific content layer (an accurate single-zero
// roulette wheel), and the game title in the accent color with a glow.
//
// textPath-free (librsvg does not support <textPath>) so the SVG and the rsvg-converted PNG match.
// Run:  node scripts/generate-og-image.mjs  &&  rsvg-convert -w 1200 -h 630 public/og-image.svg -o public/og-image.png
import { writeFileSync, mkdirSync } from 'node:fs'

const W = 1200, H = 630
const ACCENT = '#e23744'          // roulette red — the per-game accent
const GOLD = '#d4a847', CREAM = '#f5f0e1', MUTED = '#9aa6c2'
const RED = '#c1272d', BLACK = '#1c1c1c', GREEN = '#1b7a43'

// Single-zero wheel order + colors — mirrors app/engine/wheel.ts (Arizona §L / Crown Melbourne Diagram D).
const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
const colorOf = n => n === 0 ? GREEN : REDS.has(n) ? RED : BLACK

const parts = []
const p = s => parts.push(s)

// ---- defs ----
p(`<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0a0c1a"/><stop offset="1" stop-color="#060810"/>
  </linearGradient>
  <radialGradient id="vignette" cx="0.46" cy="0.44" r="0.78">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/>
  </radialGradient>
  <radialGradient id="cone" cx="0.42" cy="0.38" r="0.7">
    <stop offset="0" stop-color="#efe7cf"/><stop offset="0.45" stop-color="#bda469"/><stop offset="1" stop-color="#6b5226"/>
  </radialGradient>
  <radialGradient id="ball" cx="0.35" cy="0.32" r="0.8">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e7e7e2"/><stop offset="1" stop-color="#8f8f88"/>
  </radialGradient>
  <radialGradient id="wheelshadow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.7" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="7" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`)

// ---- background ----
p(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`)

// ---- fine grid (20px) ----
let g = []
for (let x = 0; x <= W; x += 20) g.push(`M${x} 0V${H}`)
for (let y = 0; y <= H; y += 20) g.push(`M0 ${y}H${W}`)
p(`<path d="${g.join('')}" stroke="#1e2848" stroke-width="1" fill="none"/>`)

// ---- major grid (100px) ----
g = []
for (let x = 0; x <= W; x += 100) g.push(`M${x} 0V${H}`)
for (let y = 0; y <= H; y += 100) g.push(`M0 ${y}H${W}`)
p(`<path d="${g.join('')}" stroke="#283458" stroke-width="1.25" fill="none"/>`)

// ---- dot overlay (major intersections) ----
let dots = ''
for (let x = 0; x <= W; x += 100) for (let y = 0; y <= H; y += 100) dots += `<circle cx="${x}" cy="${y}" r="1.6"/>`
p(`<g fill="#33457a">${dots}</g>`)

// ---- vignette ----
p(`<rect width="${W}" height="${H}" fill="url(#vignette)"/>`)

// ---- corner registration marks ----
const corner = (x, y, dx, dy) =>
  `<path d="M${x} ${y}h${dx}M${x} ${y}v${dy}" stroke="#3a4a6e" stroke-width="2" fill="none"/>`
p(corner(40, 40, 34, 0) + corner(40, 40, 0, 34))
p(corner(W - 40, 40, -34, 0) + corner(W - 40, 40, 0, 34))
p(corner(40, H - 40, 34, 0) + corner(40, H - 40, 0, -34))
p(corner(W - 40, H - 40, -34, 0) + corner(W - 40, H - 40, 0, -34))

// ---- the wheel (content layer) ----
const cx = 912, cy = 300, ro = 206, ri = 150, lblR = 178
const rad = d => (d * Math.PI) / 180
const pt = (r, a) => [(cx + r * Math.cos(a)).toFixed(2), (cy + r * Math.sin(a)).toFixed(2)]
const N = ORDER.length, step = 360 / N
let wedges = '', frets = ''
for (let i = 0; i < N; i++) {
  const a0 = rad(-90 + i * step), a1 = rad(-90 + (i + 1) * step)
  const [x1, y1] = pt(ro, a0), [x2, y2] = pt(ro, a1), [x3, y3] = pt(ri, a1), [x4, y4] = pt(ri, a0)
  wedges += `<path d="M${x1} ${y1}A${ro} ${ro} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 0 0 ${x4} ${y4}Z" fill="${colorOf(ORDER[i])}"/>`
  const [fx, fy] = pt(ro, a0)
  frets += `<line x1="${pt(ri, a0)[0]}" y1="${pt(ri, a0)[1]}" x2="${fx}" y2="${fy}" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1"/>`
}
p(`<ellipse cx="${cx}" cy="${cy + 8}" rx="${ro + 34}" ry="${ro + 34}" fill="url(#wheelshadow)"/>`)
p(`<circle cx="${cx}" cy="${cy}" r="${ro + 16}" fill="#2a1c0e"/>`)               // wood rim base
p(`<circle cx="${cx}" cy="${cy}" r="${ro + 12}" fill="none" stroke="${GOLD}" stroke-width="6"/>`) // gold rim
p(`<circle cx="${cx}" cy="${cy}" r="${ro + 2}" fill="#101010"/>`)                 // ball track
p(`<g>${wedges}</g><g>${frets}</g>`)
p(`<circle cx="${cx}" cy="${cy}" r="${ri}" fill="url(#cone)"/>`)                  // center cone
p(`<circle cx="${cx}" cy="${cy}" r="40" fill="#3a2c12"/>`)
p(`<circle cx="${cx}" cy="${cy - 4}" r="16" fill="${GOLD}"/>`)                    // turret
// the ball, resting in the top pocket, with a soft glow on that fret
const ballA = rad(-90 + step / 2)
const [bx, by] = pt(lblR, ballA)
p(`<circle cx="${bx}" cy="${by}" r="11" fill="url(#ball)"/>`)
p(`<circle cx="${bx}" cy="${by}" r="15" fill="none" stroke="${GOLD}" stroke-width="2" stroke-opacity="0.8"/>`)

// ---- title (left), accent + glow ----
p(`<g filter="url(#glow)"><text x="70" y="232" font-family="'Helvetica Neue',Arial,sans-serif" font-size="104" font-weight="800" fill="${ACCENT}">Roulette</text></g>`)
p(`<text x="74" y="288" font-family="'Helvetica Neue',Arial,sans-serif" font-size="40" font-weight="700" letter-spacing="14" fill="${CREAM}">TRAINER</text>`)
p(`<text x="74" y="344" font-family="'Helvetica Neue',Arial,sans-serif" font-size="23" fill="${MUTED}">A real forward-physics wheel — proven fair by simulation.</text>`)
p(`<text x="74" y="378" font-family="'Helvetica Neue',Arial,sans-serif" font-size="23" fill="${MUTED}">Learn why the only way to win is not to play.</text>`)
// little stat chips
const chip = (x, label, col) =>
  `<g><rect x="${x}" y="410" width="${label.length * 9.6 + 26}" height="34" rx="8" fill="#10182e" stroke="${col}" stroke-opacity="0.6"/><text x="${x + 13}" y="433" font-family="'Fira Code',monospace" font-size="15" fill="${col}">${label}</text></g>`
p(chip(74, '37 + 38 pockets', GOLD))
p(chip(74 + 188, '2.70% / 5.26% edge', CREAM))
p(chip(74 + 188 + 232, 'χ²-verified', '#7ee0a6'))

// ---- bottom rule + wordmark + accent bar ----
p(`<line x1="70" y1="566" x2="${W - 70}" y2="566" stroke="#283458" stroke-width="1.5"/>`)
p(`<text x="70" y="600" font-family="'Helvetica Neue',Arial,sans-serif" font-size="22" font-weight="600" letter-spacing="11" fill="${CREAM}">METAINCOGNITA</text>`)
p(`<text x="${W - 70}" y="600" text-anchor="end" font-family="'Fira Code',monospace" font-size="16" fill="${MUTED}">casino simulator suite</text>`)
p(`<rect x="0" y="${H - 4}" width="${W}" height="4" fill="${ACCENT}"/>`)

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${parts.join('\n')}\n</svg>\n`
mkdirSync('public', { recursive: true })
writeFileSync('public/og-image.svg', svg)
console.log('wrote public/og-image.svg (' + svg.length + ' bytes)')
