# Roulette Engine + Fairness Proof — Implementation Plan (Plan 1 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure-TypeScript roulette engine — both wheel variants, the full bet/pay model with edge-reducing rule presets, a deterministic seeded forward-physics landing model, and a headless simulation suite that **proves** the wheel is fair (χ² uniformity) and the edges converge to theory (2.70% / 5.26% / 7.89%) — all before any UI exists.

**Architecture:** Framework-free TypeScript under `app/engine/`, unit-tested with Vitest in Node (no Vue/Nuxt/Pinia/Phaser imports — the family "engine purity" rule). The physics model is the **source of truth** for the landing pocket: deterministic given a seeded PRNG, so it runs identically in the game and in the headless χ² proof. Money is integer cents. This plan stands alone as a testable package; when the Nuxt app is later scaffolded from the craps skeleton, `app/engine/` slots in unchanged.

**Tech Stack:** TypeScript (strict) · Vitest · pnpm/npm · mulberry32 PRNG. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-06-13-roulette-trainer-design.md` (§3 variants, §4 physics/fairness, §5 bets/pay, §6 architecture).

**Scope note:** En Prison (stateful imprisonment) and the racetrack/call bets are deferred to later plans; this plan ships La Partage + Surrender (the half-back edge-reducers), which deliver the same edge math (1.35% / 2.63%). Deepening the physics from the kinematic forward model to a full rigid-body integrator is a later refinement *behind the same χ² gate* — the engine interface does not change.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vitest.config.ts` | Minimal strict-TS + Vitest project |
| `app/engine/wheel.ts` | Pocket orders (single/double), colors, counts — pinned to the sources |
| `app/engine/prng.ts` | `mulberry32` seeded PRNG + `frac` helper |
| `app/engine/money.ts` | Integer-cents payout + formatting |
| `app/engine/bets.ts` | Bet types, pay table, coverage, settlement, La Partage/Surrender |
| `app/engine/physics.ts` | Deterministic seeded forward-physics landing model (source of truth) |
| `app/engine/round.ts` | Round phase machine: bets → spin → settle, emits typed events |
| `app/engine/sim.ts` | Headless simulation: frequencies, χ², empirical edge |
| `app/engine/*.test.ts` | Co-located Vitest tests, including the §2.4 fairness proof |

---

## Task 1: Project bootstrap

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "metaincognita-roulette-engine",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["app"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { globals: true, include: ['app/**/*.test.ts'] },
})
```

- [ ] **Step 4: Create `.gitignore`**

```gitignore
node_modules/
.superpowers/
.DS_Store
*.log
dist/
.output/
.nuxt/
.netlify/
```

- [ ] **Step 5: Install and verify the toolchain**

Run: `npm install && npx vitest run`
Expected: install succeeds; Vitest reports "No test files found" (exit 0 or "no tests").

- [ ] **Step 6: Commit**

```bash
git init
git add package.json tsconfig.json vitest.config.ts .gitignore docs/
git commit -m "chore: bootstrap roulette engine (TS strict + Vitest) and commit spec/sources"
```

---

## Task 2: Wheel data (orders, colors)

**Files:**
- Create: `app/engine/wheel.ts`
- Test: `app/engine/wheel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/wheel.test.ts
import { describe, it, expect } from 'vitest'
import { WHEEL_ORDER, REDS, colorOf, pocketCount } from './wheel'

describe('wheel data (Arizona §L / Crown Melbourne Diagrams D & G)', () => {
  it('single-zero has 37 pockets starting at 0, with the regulated order', () => {
    expect(pocketCount('single')).toBe(37)
    expect(WHEEL_ORDER.single.slice(0, 6)).toEqual([0, 32, 15, 19, 4, 21])
    expect(WHEEL_ORDER.single.at(-1)).toBe(26)
  })
  it('double-zero has 38 pockets with 00 in the regulated position', () => {
    expect(pocketCount('double')).toBe(38)
    expect(WHEEL_ORDER.double.slice(0, 6)).toEqual([0, 28, 9, 26, 30, 11])
    expect(WHEEL_ORDER.double[19]).toBe('00') // 00 sits opposite 0
  })
  it('has 18 red numbers and colors zero(s) green', () => {
    expect(REDS.size).toBe(18)
    expect(colorOf(1)).toBe('red')
    expect(colorOf(2)).toBe('black')
    expect(colorOf(0)).toBe('green')
    expect(colorOf('00')).toBe('green')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/wheel.test.ts`
Expected: FAIL — cannot find module `./wheel`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/wheel.ts
export type Variant = 'single' | 'double'
export type Pocket = number | '00'
export type Color = 'red' | 'black' | 'green'

// Clockwise pocket order — Arizona Compact §L; Crown Melbourne Diagrams D (single) & G (double).
export const WHEEL_ORDER: Record<Variant, Pocket[]> = {
  single: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
           24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
  double: [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00',
           27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2],
}

export const REDS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export function pocketCount(v: Variant): number {
  return WHEEL_ORDER[v].length
}

export function colorOf(p: Pocket): Color {
  if (p === 0 || p === '00') return 'green'
  return REDS.has(p) ? 'red' : 'black'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/wheel.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/engine/wheel.ts app/engine/wheel.test.ts
git commit -m "feat(engine): wheel pocket orders and colors pinned to regulations"
```

---

## Task 3: Seeded PRNG

**Files:**
- Create: `app/engine/prng.ts`
- Test: `app/engine/prng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/prng.test.ts
import { describe, it, expect } from 'vitest'
import { mulberry32, frac } from './prng'

describe('mulberry32 seeded PRNG', () => {
  it('is deterministic: same seed reproduces the same sequence', () => {
    const a = mulberry32(12345), b = mulberry32(12345)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })
  it('produces values in [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
  it('different seeds produce different sequences', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
  it('frac returns the fractional part for negatives too', () => {
    expect(frac(3.25)).toBeCloseTo(0.25)
    expect(frac(-0.25)).toBeCloseTo(0.75)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/prng.test.ts`
Expected: FAIL — cannot find module `./prng`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/prng.ts
export type Rng = () => number

// mulberry32 — fast, well-distributed seeded PRNG. Crypto-seeded in live play,
// fixed-seeded in tests and simulations (family "seeded randomness" rule, spec §6).
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const frac = (x: number): number => x - Math.floor(x)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/prng.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/engine/prng.ts app/engine/prng.test.ts
git commit -m "feat(engine): mulberry32 seeded PRNG"
```

---

## Task 4: Money (integer cents)

**Files:**
- Create: `app/engine/money.ts`
- Test: `app/engine/money.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/money.test.ts
import { describe, it, expect } from 'vitest'
import { winningsCents, formatCents } from './money'

describe('money (integer cents)', () => {
  it('computes X:1 winnings as stake * X', () => {
    expect(winningsCents(500, 35)).toBe(17500) // $5 straight up pays $175
    expect(winningsCents(100, 1)).toBe(100)    // even money
  })
  it('formats cents as dollars', () => {
    expect(formatCents(12345)).toBe('$123.45')
    expect(formatCents(5)).toBe('$0.05')
    expect(formatCents(-50)).toBe('-$0.50')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/money.test.ts`
Expected: FAIL — cannot find module `./money`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/money.ts
// All wagers, payouts and bankrolls are integer cents — no floats (spec §6).

// Roulette payouts are all whole "X to 1", so winnings are exact integers.
export function winningsCents(stakeCents: number, payX: number): number {
  return stakeCents * payX
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const a = Math.abs(cents)
  return `${sign}$${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/money.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/engine/money.ts app/engine/money.test.ts
git commit -m "feat(engine): integer-cents money helpers"
```

---

## Task 5: Bets — pay table, coverage, settlement

**Files:**
- Create: `app/engine/bets.ts`
- Test: `app/engine/bets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/bets.test.ts
import { describe, it, expect } from 'vitest'
import { PAYOUTS, COLUMNS, DOZENS, coverage, settleBet, type Bet, type Rules } from './bets'

const AMERICAN: Rules = { variant: 'double', evenMoney: 'none' }
const EUROPEAN: Rules = { variant: 'single', evenMoney: 'none' }

describe('pay table (Arizona / Melbourne / Colorado — identical)', () => {
  it('pins every payout', () => {
    expect(PAYOUTS).toMatchObject({
      straight: 35, split: 17, street: 11, corner: 8, firstFive: 6, sixline: 5,
      column: 2, dozen: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
    })
  })
})

describe('coverage', () => {
  it('covers the right pockets for outside bets', () => {
    expect(coverage({ type: 'red', numbers: [], stakeCents: 100 }).size).toBe(18)
    expect([...coverage({ type: 'low', numbers: [], stakeCents: 100 })].sort((a, b) => +a - +b)[0]).toBe(1)
    expect(coverage({ type: 'high', numbers: [], stakeCents: 100 }).has(36)).toBe(true)
    expect(coverage({ type: 'column', numbers: COLUMNS[0], stakeCents: 100 }).has(34)).toBe(true)
    expect(coverage({ type: 'dozen', numbers: DOZENS[2], stakeCents: 100 }).has(25)).toBe(true)
  })
})

describe('settlement', () => {
  it('pays a winning straight up: stake back + 35x', () => {
    const bet: Bet = { type: 'straight', numbers: [17], stakeCents: 100 }
    expect(settleBet(bet, 17, EUROPEAN)).toEqual({ won: true, returnCents: 3600 })
  })
  it('collects a losing straight up', () => {
    const bet: Bet = { type: 'straight', numbers: [17], stakeCents: 100 }
    expect(settleBet(bet, 18, EUROPEAN)).toEqual({ won: false, returnCents: 0 })
  })
  it('pays the American First Five (0,00,1,2,3) at 6:1', () => {
    const bet: Bet = { type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 100 }
    expect(settleBet(bet, 2, AMERICAN)).toEqual({ won: true, returnCents: 700 })
  })
  it('loses even-money bets on zero with no rule', () => {
    const bet: Bet = { type: 'red', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, 0, EUROPEAN)).toEqual({ won: false, returnCents: 0 })
  })
  it('returns half on zero under La Partage', () => {
    const bet: Bet = { type: 'red', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, 0, { variant: 'single', evenMoney: 'la_partage' }))
      .toEqual({ won: false, returnCents: 50 })
  })
  it('returns half on 00 under Surrender', () => {
    const bet: Bet = { type: 'even', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, '00', { variant: 'double', evenMoney: 'surrender' }))
      .toEqual({ won: false, returnCents: 50 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/bets.test.ts`
Expected: FAIL — cannot find module `./bets`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/bets.ts
import { type Pocket, type Variant, REDS } from './wheel'
import { winningsCents } from './money'

export type BetType =
  | 'straight' | 'split' | 'street' | 'corner' | 'firstFive' | 'sixline'
  | 'column' | 'dozen' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'

// X in "X to 1" — identical across Arizona, Melbourne and Colorado pay tables.
export const PAYOUTS: Record<BetType, number> = {
  straight: 35, split: 17, street: 11, corner: 8, firstFive: 6, sixline: 5,
  column: 2, dozen: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
}

export type EvenMoneyRule = 'none' | 'la_partage' | 'surrender' // En Prison: later plan (stateful)
export interface Rules { variant: Variant; evenMoney: EvenMoneyRule }

// Inside bets and column/dozen carry their explicit pockets in `numbers`.
// Outside even-money/range bets derive coverage from the type.
export interface Bet { type: BetType; numbers: Pocket[]; stakeCents: number }

export interface Settlement { won: boolean; returnCents: number } // returnCents = stake + winnings, else 0 (or half-back)

const EVEN_MONEY: ReadonlySet<BetType> = new Set<BetType>(['red', 'black', 'odd', 'even', 'low', 'high'])

function range(a: number, b: number): number[] {
  const r: number[] = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}

export const COLUMNS: number[][] = [
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
]
export const DOZENS: number[][] = [range(1, 12), range(13, 24), range(25, 36)]

export function coverage(bet: Bet): Set<Pocket> {
  switch (bet.type) {
    case 'red': return new Set<Pocket>([...REDS])
    case 'black': return new Set<Pocket>(range(1, 36).filter((n) => !REDS.has(n)))
    case 'odd': return new Set<Pocket>(range(1, 36).filter((n) => n % 2 === 1))
    case 'even': return new Set<Pocket>(range(1, 36).filter((n) => n % 2 === 0))
    case 'low': return new Set<Pocket>(range(1, 18))
    case 'high': return new Set<Pocket>(range(19, 36))
    default: return new Set<Pocket>(bet.numbers) // straight/split/street/corner/firstFive/sixline/column/dozen
  }
}

export function covers(bet: Bet, result: Pocket): boolean {
  return coverage(bet).has(result)
}

export function settleBet(bet: Bet, result: Pocket, rules: Rules): Settlement {
  if (covers(bet, result)) {
    return { won: true, returnCents: bet.stakeCents + winningsCents(bet.stakeCents, PAYOUTS[bet.type]) }
  }
  const isZero = result === 0 || result === '00'
  const halfBack = rules.evenMoney === 'la_partage' || rules.evenMoney === 'surrender'
  if (isZero && halfBack && EVEN_MONEY.has(bet.type)) {
    return { won: false, returnCents: Math.floor(bet.stakeCents / 2) }
  }
  return { won: false, returnCents: 0 }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/bets.test.ts`
Expected: PASS (all groups).

- [ ] **Step 5: Commit**

```bash
git add app/engine/bets.ts app/engine/bets.test.ts
git commit -m "feat(engine): bet pay table, coverage, settlement with La Partage/Surrender"
```

---

## Task 6: Forward-physics landing model (source of truth)

**Files:**
- Create: `app/engine/physics.ts`
- Test: `app/engine/physics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/physics.test.ts
import { describe, it, expect } from 'vitest'
import { mulberry32 } from './prng'
import { simulateSpin } from './physics'
import { WHEEL_ORDER, pocketCount } from './wheel'

describe('forward-physics landing (deterministic, seeded — spec §4)', () => {
  it('is deterministic for a given seed', () => {
    const a = simulateSpin(mulberry32(99), 'single')
    const b = simulateSpin(mulberry32(99), 'single')
    expect(a).toEqual(b)
  })
  it('returns an in-range index and the matching pocket', () => {
    const r = mulberry32(3)
    for (let i = 0; i < 500; i++) {
      const spin = simulateSpin(r, 'double')
      expect(spin.index).toBeGreaterThanOrEqual(0)
      expect(spin.index).toBeLessThan(pocketCount('double'))
      expect(spin.pocket).toBe(WHEEL_ORDER.double[spin.index])
    }
  })
  it('a strong bias concentrates outcomes into the favored arc', () => {
    const r = mulberry32(5)
    let inArc = 0
    for (let i = 0; i < 2000; i++) {
      const { index } = simulateSpin(r, 'single', { biasStrength: 1, biasCenter: 7, biasWidth: 5 })
      if (index >= 7 && index < 12) inArc++
    }
    expect(inArc).toBe(2000) // biasStrength 1 forces the arc every spin
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/physics.test.ts`
Expected: FAIL — cannot find module `./physics`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/physics.ts
import { type Variant, type Pocket, WHEEL_ORDER, pocketCount } from './wheel'
import { type Rng, frac } from './prng'

// Optional wheel imperfection — drives the Lab's bias lessons (spec §8). A perfect
// wheel uses {} and the §2.4 χ² proof shows it is uniform.
export interface WheelCondition {
  biasStrength?: number // P(this spin is captured by the favored arc), 0..1
  biasCenter?: number   // favored arc start index (rotor frame)
  biasWidth?: number    // favored arc width in pockets
}

export interface Spin { index: number; pocket: Pocket }

// Reduced-order forward model: the ball travels many revolutions (≥4) opposite the
// rotor, leaves the track near a diamond, and is captured at a rotor-relative angle.
// Because total ball travel and rotor travel each span many turns, the drop angle and
// the rotor angle at capture are independent and ~uniform, so the relative angle — and
// thus the pocket — is ~uniform. Verified by the χ² proof in sim.test.ts. Deepening to a
// full rigid-body integrator is a later refinement behind the same gate.
export function simulateSpin(rng: Rng, variant: Variant, cond: WheelCondition = {}): Spin {
  const N = pocketCount(variant)
  const ballRevs = 7 + rng() * 6   // ~7–13 revolutions (≥4 regulatory floor)
  const rotorRevs = 3 + rng() * 5
  // Lab-frame fraction (turns) where the ball leaves the track, pulled toward one of 8 diamonds.
  let dropTurn = frac(ballRevs + rng() * 0.13)
  const diamond = Math.round(dropTurn * 8) / 8
  dropTurn = frac(diamond + (dropTurn - diamond) * 0.55 + (rng() - 0.5) * 0.05)
  const rotorTurn = frac(rotorRevs + rng() * 0.07)
  const scatter = (rng() - 0.5) * (2.5 / N) // ±~1 pocket of fret scatter
  const rel = frac(dropTurn - rotorTurn + scatter)
  let index = Math.floor(rel * N) % N

  const strength = cond.biasStrength ?? 0
  if (strength > 0 && rng() < strength) {
    const center = cond.biasCenter ?? 7
    const width = cond.biasWidth ?? 5
    index = (((center + Math.floor(rng() * width)) % N) + N) % N
  }
  return { index, pocket: WHEEL_ORDER[variant][index] as Pocket }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/physics.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/engine/physics.ts app/engine/physics.test.ts
git commit -m "feat(engine): deterministic seeded forward-physics landing model"
```

---

## Task 7: Round phase machine

**Files:**
- Create: `app/engine/round.ts`
- Test: `app/engine/round.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/round.test.ts
import { describe, it, expect } from 'vitest'
import { RouletteGame } from './round'
import { mulberry32 } from './prng'
import { simulateSpin } from './physics'
import { type Rules } from './bets'

const EUROPEAN: Rules = { variant: 'single', evenMoney: 'none' }

describe('RouletteGame round machine', () => {
  it('plays a deterministic round and reports net P&L from a seed', () => {
    const r1 = new RouletteGame(EUROPEAN, 42).playRound([{ type: 'red', numbers: [], stakeCents: 100 }])
    const r2 = new RouletteGame(EUROPEAN, 42).playRound([{ type: 'red', numbers: [], stakeCents: 100 }])
    expect(r2.pocket).toBe(r1.pocket) // same seed → same pocket

    expect(r1.totalStakeCents).toBe(100)
    expect(r1.netCents).toBe(r1.totalReturnCents - 100)
    expect(r1.events.map((e) => e.type)).toEqual(['no-more-bets', 'ball-settled', 'settled'])
  })

  it('advances the stream so rounds are not all identical', () => {
    const game = new RouletteGame(EUROPEAN, 7)
    const pockets = Array.from({ length: 20 }, () => game.playRound([]).pocket)
    expect(new Set(pockets).size).toBeGreaterThan(1) // the stream advances; not stuck on one pocket
  })

  it('settles a winning straight up correctly', () => {
    // Find a seed whose first single-zero spin lands on 17, then bet it.
    // The game's first spin == simulateSpin(mulberry32(seed), 'single'), so the seed matches.
    let seed = 0
    while (simulateSpin(mulberry32(seed), 'single').pocket !== 17) seed++
    const r = new RouletteGame(EUROPEAN, seed).playRound([{ type: 'straight', numbers: [17], stakeCents: 100 }])
    expect(r.pocket).toBe(17)
    expect(r.netCents).toBe(3500) // 3600 returned − 100 staked
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/round.test.ts`
Expected: FAIL — cannot find module `./round`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/round.ts
import { type Pocket } from './wheel'
import { type Rng, mulberry32 } from './prng'
import { type Bet, type Rules, settleBet } from './bets'
import { simulateSpin, type WheelCondition } from './physics'

export type Phase = 'betting' | 'spun' | 'settled'

export interface RoundEvent {
  type: 'no-more-bets' | 'ball-settled' | 'settled'
  pocket?: Pocket
}

export interface PerBetResult {
  bet: Bet
  won: boolean
  returnCents: number
}

export interface RoundResult {
  pocket: Pocket
  perBet: PerBetResult[]
  totalStakeCents: number
  totalReturnCents: number
  netCents: number
  events: RoundEvent[]
}

// One continuous seeded stream per game session (live: crypto-seeded; tests: fixed).
// The §2.4 proof bug we hit in the prototype — re-seeding per spin — must never recur.
export class RouletteGame {
  private rng: Rng
  constructor(private rules: Rules, seed: number, private cond: WheelCondition = {}) {
    this.rng = mulberry32(seed)
  }

  playRound(bets: Bet[]): RoundResult {
    const events: RoundEvent[] = [{ type: 'no-more-bets' }]
    const { pocket } = simulateSpin(this.rng, this.rules.variant, this.cond)
    events.push({ type: 'ball-settled', pocket })

    const perBet: PerBetResult[] = bets.map((bet) => {
      const s = settleBet(bet, pocket, this.rules)
      return { bet, won: s.won, returnCents: s.returnCents }
    })
    const totalStakeCents = bets.reduce((a, b) => a + b.stakeCents, 0)
    const totalReturnCents = perBet.reduce((a, p) => a + p.returnCents, 0)
    events.push({ type: 'settled', pocket })

    return {
      pocket,
      perBet,
      totalStakeCents,
      totalReturnCents,
      netCents: totalReturnCents - totalStakeCents,
      events,
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/engine/round.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/engine/round.ts app/engine/round.test.ts
git commit -m "feat(engine): event-driven round phase machine"
```

---

## Task 8: The fairness proof (§2.4 simulation)

**Files:**
- Create: `app/engine/sim.ts`
- Test: `app/engine/sim.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/engine/sim.test.ts
import { describe, it, expect } from 'vitest'
import { runFrequencies, chiSquare, measureEdge } from './sim'
import { type Bet, type Rules } from './bets'

const SPINS = 1_000_000

describe('§2.4 fairness proof — the wheel is uniform', () => {
  it('single-zero passes χ² uniformity (df=36, well under the 99.9% critical ≈ 70)', () => {
    const chi = chiSquare(runFrequencies('single', SPINS, 0xC0FFEE))
    expect(chi).toBeLessThan(70)
  })
  it('double-zero passes χ² uniformity (df=37, well under ≈ 71)', () => {
    const chi = chiSquare(runFrequencies('double', SPINS, 0xBADA55))
    expect(chi).toBeLessThan(71)
  })
})

describe('§2.4 fairness proof — edges converge to theory', () => {
  const red = (): Bet => ({ type: 'red', numbers: [], stakeCents: 100 })

  it('European red converges to 2.70%', () => {
    const edge = measureEdge('single', red, { variant: 'single', evenMoney: 'none' }, SPINS, 1)
    expect(edge).toBeCloseTo(0.027, 2) // within 0.005
  })
  it('American red converges to 5.26%', () => {
    const edge = measureEdge('double', red, { variant: 'double', evenMoney: 'none' }, SPINS, 2)
    expect(edge).toBeCloseTo(0.0526, 2)
  })
  it('American First Five is the worst bet at 7.89%', () => {
    const basket = (): Bet => ({ type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 100 })
    const edge = measureEdge('double', basket, { variant: 'double', evenMoney: 'none' }, SPINS, 3)
    expect(Math.abs(edge - 0.0789)).toBeLessThan(0.01)
  })
  it('La Partage halves the European even-money edge to 1.35%', () => {
    const edge = measureEdge('single', red, { variant: 'single', evenMoney: 'la_partage' }, SPINS, 4)
    expect(edge).toBeCloseTo(0.0135, 2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/engine/sim.test.ts`
Expected: FAIL — cannot find module `./sim`.

- [ ] **Step 3: Write the implementation**

```ts
// app/engine/sim.ts
import { type Variant, pocketCount } from './wheel'
import { mulberry32 } from './prng'
import { simulateSpin, type WheelCondition } from './physics'
import { type Bet, type Rules, settleBet } from './bets'

// Tally landing-index frequencies over N seeded spins from one continuous stream.
export function runFrequencies(
  variant: Variant,
  spins: number,
  seed: number,
  cond: WheelCondition = {},
): number[] {
  const rng = mulberry32(seed)
  const counts = new Array<number>(pocketCount(variant)).fill(0)
  for (let i = 0; i < spins; i++) counts[simulateSpin(rng, variant, cond).index]++
  return counts
}

// Pearson χ² against a flat expectation. For a uniform wheel this ~ df (= pockets − 1).
export function chiSquare(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  const expected = total / counts.length
  return counts.reduce((s, o) => s + ((o - expected) * (o - expected)) / expected, 0)
}

// Empirical house edge for a repeated single bet: (staked − returned) / staked.
export function measureEdge(
  variant: Variant,
  makeBet: () => Bet,
  rules: Rules,
  spins: number,
  seed: number,
): number {
  const rng = mulberry32(seed)
  let staked = 0
  let returned = 0
  for (let i = 0; i < spins; i++) {
    const { pocket } = simulateSpin(rng, variant, {})
    const bet = makeBet()
    staked += bet.stakeCents
    returned += settleBet(bet, pocket, rules).returnCents
  }
  return (staked - returned) / staked
}
```

- [ ] **Step 4: Run the proof and verify it passes**

Run: `npx vitest run app/engine/sim.test.ts`
Expected: PASS (6 tests). Runtime a few seconds (6M spins total).
If a χ² test fails, the model is not uniform — that is the gate doing its job; tune the model (or apply the documented fret-settle governor from spec §4) until it passes. Do **not** loosen the threshold to force a pass.

- [ ] **Step 5: Run the whole suite + typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: all test files PASS; `tsc --noEmit` reports no errors.

- [ ] **Step 6: Commit**

```bash
git add app/engine/sim.ts app/engine/sim.test.ts
git commit -m "feat(engine): §2.4 fairness proof — χ² uniformity and edge convergence"
```

---

## Self-Review — spec coverage

| Spec requirement | Covered by |
|---|---|
| Both wheel variants, orders, colors (§3) | Task 2 |
| Seeded, reproducible PRNG; one continuous stream (§4, §6) | Tasks 3, 7 |
| Integer cents (§6) | Task 4 |
| Full pay table pinned to all three sources (§5) | Task 5 |
| La Partage / Surrender edge-reducers (§3) | Task 5 |
| Forward physics as source of truth; bias as Lab input (§4, §8) | Task 6 |
| Event-driven round machine (§6) | Task 7 |
| §2.4 proof: χ² uniformity + edge convergence to 2.70/5.26/7.89 | Task 8 |
| Engine purity (no framework imports) | All — pure TS under `app/engine/` |

**Deferred (noted, with a home in a later plan):** En Prison (stateful imprisonment); racetrack/call bets; deeper rigid-body physics fidelity; the UI replay renderer (Plan 2); persistence, trainer surfaces, and the Lab UI (Plans 2–4).

---

## Execution Handoff

Plan complete. **Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
