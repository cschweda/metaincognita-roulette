# Roulette Wheel — Implementation Plan (Plan 2b of the UI phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wheel spin for real on `/wheel`: a hand-rolled canvas wheel (productionized from the approved prototype) that **replays the engine's computed outcome** — click Spin, the engine decides the pocket (source of truth), the ball does its ~10s decelerating physics animation to land exactly there, and the result is revealed with a winner glow and a history strip. No betting yet (that's Plan 2c); a spin with no bets just shows the number.

**Architecture:** The engine remains the source of truth. The store holds a seeded `RouletteGame` and a `computeSpin()` that runs the engine *before* any animation. The `/wheel` page hands the resulting pocket to the wheel component, which **only renders and animates** to that pocket (no outcome logic in the view), then emits `settled`, at which point the store `commitSpin()`s it (history + stats + persist) and the page reveals it. This is the §4 event-paced boundary: engine state known immediately; presented state revealed after the animation. `prefers-reduced-motion` snaps to the result.

**Tech Stack:** Vue 3 SFC + Canvas 2D (hand-rolled, no game-engine library) · Pinia · the existing pure-TS engine.

**Approved visual/physics reference:** the prototype `.superpowers/brainstorm/16915-1781372333/content/wheel-physics-v6.html` (the exact ball feel the user signed off: perfect circle, ~7–9 revolutions over ~10s, decelerating launch, ball resting inward of the number, gold winner glow, weighted shaded ball, reduced-motion snap). Port its `drawWheel`/spin animation; **replace its internal outcome computation with the engine-provided target pocket.**

**Spec:** `docs/superpowers/specs/2026-06-13-roulette-trainer-design.md` (§4 physics/source-of-truth, §6 event-paced boundary, §9 UI/reduced-motion).

**Engine/app context:** `app/engine/wheel.ts` (`WHEEL_ORDER`, `Pocket`, `colorOf`, `pocketCount`), `app/engine/round.ts` (`RouletteGame`, `RoundResult`), `app/engine/prng.ts` (`mulberry32`). Store `app/stores/roulette.ts` (`useRouletteStore`) already has `variant`, `evenMoney`, `bets`, `spinHistory`, `sessionStats`, `phase`, `saveToLocalStorage`. `app/utils/format.ts` (`formatCents`).

**Conventions:** Conventional Commits, NO AI trailer. Integer cents. Engine never imports Vue. Run `pnpm test`, `NODE_OPTIONS=--max-old-space-size=8192 pnpm typecheck`, and `pnpm lint` green before each commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/stores/roulette.ts` (modify) | Add a seeded `RouletteGame` instance + `computeSpin()` / `commitSpin()` + phase transitions |
| `app/components/wheel/RouletteWheel.vue` (create) | Canvas wheel; `spinTo(pocket)` animates to the engine's pocket, emits `settled`; reduced-motion snap |
| `app/components/wheel/ResultBadge.vue` (create) | The revealed number + color + recent-spins strip |
| `app/pages/wheel.vue` (modify) | Replace the placeholder felt with the wheel + Spin control + result/ history; drive the paced reveal |
| `test/unit/store-spin.test.ts` (create) | Store spin actions (seeded, deterministic) |
| `test/nuxt/roulette-wheel.test.ts` (create) | Component mounts; reduced-motion path emits `settled` |

---

## Task 1: Store — seeded game + paced spin actions

**Files:** Modify `app/stores/roulette.ts`; Create `test/unit/store-spin.test.ts`.

- [ ] **Step 1: Write the failing test `test/unit/store-spin.test.ts`** (uses Pinia in a node test; seed injected for determinism):

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'

beforeEach(() => setActivePinia(createPinia()))

describe('store spin actions', () => {
  it('computeSpin returns an engine pocket without revealing; commitSpin records it', () => {
    const store = useRouletteStore()
    store.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 100_000, selectedChipCents: 500 }, 123)
    expect(store.phase).toBe('betting')

    const result = store.computeSpin()
    expect(store.phase).toBe('spinning')          // computed, not yet revealed
    expect(store.spinHistory.length).toBe(0)       // reveal happens on commit
    expect(result.pocket === 0 || typeof result.pocket === 'number' || result.pocket === '00').toBe(true)

    store.commitSpin(result)
    expect(store.phase).toBe('resolved')
    expect(store.spinHistory.length).toBe(1)
    expect(store.spinHistory[0]!.pocket).toBe(result.pocket)
    expect(store.sessionStats.spins).toBe(1)
  })

  it('is deterministic for a fixed seed', () => {
    const a = useRouletteStore()
    a.initializeGame({ presetId: 'european', playerName: 'A', bankrollCents: 100_000, selectedChipCents: 500 }, 999)
    const r1 = a.computeSpin()
    setActivePinia(createPinia())
    const b = useRouletteStore()
    b.initializeGame({ presetId: 'european', playerName: 'B', bankrollCents: 100_000, selectedChipCents: 500 }, 999)
    const r2 = b.computeSpin()
    expect(r2.pocket).toBe(r1.pocket)
  })
})
```

- [ ] **Step 2: Run `pnpm test:unit` — expect FAIL** (`computeSpin`/seed arg don't exist yet).

- [ ] **Step 3: Modify `app/stores/roulette.ts`** with these exact changes:
  - Add imports at top:
    ```ts
    import { markRaw } from 'vue'
    import { RouletteGame, type RoundResult } from '../engine/round'
    import type { Pocket } from '../engine/wheel'
    ```
  - Add to `state`:
    ```ts
    game: null as RouletteGame | null,
    revealPocket: null as Pocket | null,
    ```
  - Add a private helper to build the game (crypto seed in real use, injectable in tests):
    ```ts
    function cryptoSeed(): number {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return crypto.getRandomValues(new Uint32Array(1))[0]!
      }
      return Math.floor(Math.random() * 0xffffffff) >>> 0
    }
    ```
    (Place this above `useRouletteStore`. Note: the engine's seeded stream is per-session; mid-session restore reuses a fresh stream — results stay fair, history is what persists.)
  - In `initializeGame(args, seed?)` — add an optional second parameter `seed?: number` and, after setting variant/evenMoney, create the game:
    ```ts
    this.game = markRaw(new RouletteGame({ variant: preset.variant, evenMoney: preset.evenMoney }, seed ?? cryptoSeed()))
    this.revealPocket = null
    ```
  - In `loadFromLocalStorage()` — after restoring fields, create a fresh game:
    ```ts
    this.game = markRaw(new RouletteGame({ variant: this.variant, evenMoney: this.evenMoney }, cryptoSeed()))
    ```
  - Add two actions:
    ```ts
    computeSpin(): RoundResult {
      if (!this.game) throw new Error('no game in progress')
      this.phase = 'spinning'
      this.revealPocket = null
      return this.game.playRound(this.bets)   // engine = source of truth; not yet revealed
    },
    commitSpin(result: RoundResult) {
      this.bankrollCents += result.netCents    // 0 when there are no bets (Plan 2c adds wagering)
      this.spinHistory.unshift({ pocket: result.pocket, netCents: result.netCents })
      this.spinHistory = this.spinHistory.slice(0, 50)
      this.sessionStats.spins += 1
      this.sessionStats.wageredCents += result.totalStakeCents
      this.sessionStats.netCents += result.netCents
      this.revealPocket = result.pocket
      this.phase = 'resolved'
      this.saveToLocalStorage()
    },
    readyForNextSpin() {
      this.phase = 'betting'
    },
    ```
  - Update the `Phase` type comment is already `'setup' | 'betting' | 'spinning' | 'resolved'` — no change needed.

- [ ] **Step 4: Run `pnpm test:unit` — expect PASS** (39: 37 prior + 2 new).

- [ ] **Step 5: Quality gates** — `NODE_OPTIONS=--max-old-space-size=8192 pnpm typecheck` clean, `pnpm lint` clean (mind comma-dangle/brace style).

- [ ] **Step 6: Commit**

```bash
git add app/stores/roulette.ts test/unit/store-spin.test.ts
git commit -m "feat(ui): seeded game + paced computeSpin/commitSpin in the store"
```

---

## Task 2: The canvas wheel component

**Files:** Create `app/components/wheel/RouletteWheel.vue`; Test `test/nuxt/roulette-wheel.test.ts`.

- [ ] **Step 1: Write the failing component test `test/nuxt/roulette-wheel.test.ts`:**

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RouletteWheel from '../../app/components/wheel/RouletteWheel.vue'

describe('RouletteWheel', () => {
  it('renders a canvas for the chosen variant', async () => {
    const wrapper = await mountSuspended(RouletteWheel, { props: { variant: 'single', reducedMotion: true } })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
  it('reduced-motion spinTo resolves to the target pocket synchronously-ish', async () => {
    const wrapper = await mountSuspended(RouletteWheel, { props: { variant: 'single', reducedMotion: true } })
    const settled: unknown[] = []
    wrapper.vm.$emit = ((e: string, ...a: unknown[]) => { if (e === 'settled') settled.push(a[0]) }) as never
    // call the exposed method
    await (wrapper.vm as unknown as { spinTo: (p: number) => Promise<void> }).spinTo(17)
    // With reducedMotion, settled should have been emitted with 17
    expect(settled).toContain(17)
  })
})
```
(If `wrapper.vm.$emit` override is awkward in the Nuxt runtime, instead assert that `spinTo` resolves without throwing under `reducedMotion: true`, and verify the emitted event via `wrapper.emitted('settled')`. Use whichever the test runner supports; the behavioral requirement is: **reducedMotion makes `spinTo(p)` resolve and emit `settled` with `p` immediately.**)

- [ ] **Step 2: Run `pnpm test:nuxt` — expect FAIL** (component missing).

- [ ] **Step 3: Create `app/components/wheel/RouletteWheel.vue`.** Port the wheel rendering + spin animation from the prototype `.superpowers/brainstorm/16915-1781372333/content/wheel-physics-v6.html` (read it). Adapt as follows — this is the important part:

  **Props:** `{ variant: 'single' | 'double'; reducedMotion?: boolean; size?: number }`.
  **Emits:** `settled(pocket: Pocket)`.
  **Exposed method (via `defineExpose`):** `spinTo(pocket: Pocket): Promise<void>` — animates the ball to land in `pocket` and resolves + emits `settled(pocket)` when at rest.

  Port verbatim from v6 (keep the exact approved feel): the `drawWheel(rotor, ball, win)` renderer (perfect circle `KY=1`, wood rim, gold rim, ball track, the colored pocket ring, center cone + turret, the 8 diamonds, the weighted shaded ball with contact shadow + specular, the gold winner-glow on the winning segment), and the decelerating spin animation (`easeOut` exponent 2.2, `Ttot≈10`s, `revs` 7–9, `rotorW≈1.1`, rest at `R_REST` inward of the number, the diamond-rattle radius wobble, the random `A_final` rest angle).

  **Replace v6's outcome computation:** v6 computed its own target via `simulateLanding`. Here the **target pocket is provided** to `spinTo(pocket)`. Convert it to the rotor index with `const targetIdx = WHEEL_ORDER[variant].indexOf(pocket)`, then use v6's existing "land exactly at A_final / rotorAtRest" math with that `targetIdx` (the same backward-solve v6 already does for its chosen target). On the final frame, resolve the promise and `emit('settled', pocket)`.

  **Data from the engine, not hardcoded:** build the pocket ring from `WHEEL_ORDER[props.variant]` and color via `colorOf` (import from `~/engine/wheel`). `N = pocketCount(variant)`.

  **Reduced motion:** if `props.reducedMotion` (or `window.matchMedia('(prefers-reduced-motion: reduce)').matches`), skip the animation: draw the rest frame at the target pocket immediately, `emit('settled', pocket)`, and resolve.

  **Lifecycle:** create the canvas context in `onMounted`; draw the idle wheel; on `variant` change, redraw. Cancel any in-flight `requestAnimationFrame` on unmount and at the start of each `spinTo`. Guard against `spinTo` being called while already spinning (ignore or queue — ignore is fine).

  Keep the engine pure (this component imports engine *data/functions*, which is allowed in the UI layer; the engine must not import this).

- [ ] **Step 4: Run `pnpm test:nuxt` — expect PASS.** (If the happy-dom canvas context is null in the test environment, guard the drawing code with `if (!ctx) { emit('settled', pocket); return }` so the reduced-motion path still resolves; the visual is verified in the browser smoke, Task 4.)

- [ ] **Step 5: Quality gates** (typecheck + lint clean).

- [ ] **Step 6: Commit**

```bash
git add app/components/wheel/RouletteWheel.vue test/nuxt/roulette-wheel.test.ts
git commit -m "feat(ui): canvas roulette wheel that replays the engine's pocket"
```

---

## Task 3: Wire the wheel into `/wheel` with the paced reveal

**Files:** Create `app/components/wheel/ResultBadge.vue`; Modify `app/pages/wheel.vue`.

- [ ] **Step 1: Create `app/components/wheel/ResultBadge.vue`** — shows the latest result and the recent-spins strip:

```vue
<template>
  <div class="flex flex-col items-center gap-3">
    <div v-if="latest !== null" class="flex items-center gap-3">
      <span class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            :style="{ background: bg(latest) }">{{ latest }}</span>
      <span class="font-mono text-lg" :style="{ color: 'var(--cream)' }">{{ colorOf(latest).toUpperCase() }}</span>
    </div>
    <div class="flex gap-1 flex-wrap justify-center max-w-md">
      <span v-for="(h, i) in history" :key="i"
            class="w-6 h-6 rounded text-[11px] font-semibold text-white flex items-center justify-center"
            :style="{ background: bg(h) }">{{ h }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colorOf, type Pocket } from '~/engine/wheel'
defineProps<{ latest: Pocket | null; history: Pocket[] }>()
const COLORS: Record<string, string> = { red: 'var(--chip-red)', black: '#262626', green: 'var(--chip-green)' }
const bg = (p: Pocket) => COLORS[colorOf(p)]!
</script>
```

- [ ] **Step 2: Replace `app/pages/wheel.vue`'s felt placeholder** with the wheel + a Spin control + the result badge. Keep the existing header + storage-warning banner; swap the placeholder `<div>` for:

```vue
    <div class="flex-1 flex flex-col items-center justify-center gap-5 py-4" :style="{ background: 'var(--felt-dark)' }">
      <RouletteWheel ref="wheelRef" :variant="store.variant" :reduced-motion="reducedMotion" :size="460" />
      <ResultBadge :latest="store.revealPocket" :history="historyPockets" />
      <UButton color="primary" size="lg" :loading="store.phase === 'spinning'" :disabled="store.phase === 'spinning'" @click="spin">
        {{ store.phase === 'spinning' ? 'Spinning…' : 'Spin' }}
      </UButton>
    </div>
```
  And the `<script setup>` — the page `await`s `spinTo`, then commits, so the reveal is paced with the animation (no `@settled` handling needed for the commit):

```ts
import { ref, computed, onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents } from '~/utils/format'
import type { Pocket } from '~/engine/wheel'

const store = useRouletteStore()
const wheelRef = ref<{ spinTo: (p: Pocket) => Promise<void> } | null>(null)
const reducedMotion = ref(false)
const historyPockets = computed(() => store.spinHistory.map(s => s.pocket))

onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) { navigateTo('/'); return }
  reducedMotion.value = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

async function spin() {
  if (store.phase === 'spinning' || !wheelRef.value) return
  const result = store.computeSpin()            // engine decides (source of truth)
  await wheelRef.value.spinTo(result.pocket)     // wheel replays it; resolves at rest
  store.commitSpin(result)                       // reveal now, paced with the animation
  store.readyForNextSpin()
}
```
  (`formatCents` stays for the existing header. The component still emits `settled` as part of its contract, but the page doesn't need to handle it since it `await`s `spinTo`.)

- [ ] **Step 3: Verify compile** — boot `timeout 70 pnpm dev` (or start/poll/kill), confirm `/wheel` compiles with no errors. Run `pnpm test` (39) + typecheck + lint.

- [ ] **Step 4: Commit**

```bash
git add app/components/wheel/ResultBadge.vue app/pages/wheel.vue
git commit -m "feat(ui): /wheel spins the real engine wheel with a paced reveal"
```

---

## Task 4: Browser smoke + a11y

**Files:** none (verification + fix-forward).

- [ ] **Step 1: Start the dev server** (`./start-dev-server.sh` or `pnpm dev`), then create a session (inject a valid `roulette-session-v1` blob or go through setup) and open `/wheel`.

- [ ] **Step 2: Drive the real app, watch the console:**
  - Click **Spin** → the ball launches opposite the rotor, decelerates over ~10s, drops past the diamonds, and **rests in a pocket with the gold winner glow**. No console errors.
  - The **revealed number/color matches the resting pocket** (cross-check the ResultBadge against the glowing pocket — they MUST agree; this is the §4 render-verification that the view replays the engine's pocket cell-for-cell).
  - The recent-spins strip prepends the new result; spin several times and confirm results vary (the seeded stream advances — no "6 black on repeat").
  - The Spin button shows a loading/disabled state during the spin and re-enables after.
  - **Refresh** mid-session → the history strip restores from storage.
  - Toggle OS reduced-motion (or set `reducedMotion` true) → Spin **snaps** to the result with no animation and still reveals correctly.
- [ ] **Step 3: a11y** — run `lightcap run_a11y` on `/wheel` (with a session) and `/`; resolve any AA regressions (target the prior 100). The canvas needs an accessible name — add `aria-label="Roulette wheel"` and `role="img"` (or a visually-hidden live region announcing the result for screen readers, matching the dealer-call aria-live standard).
- [ ] **Step 4: Quality gates** — `pnpm test` (39), typecheck, lint all green.
- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(ui): wheel browser-smoke + a11y (aria-label, result announce)"
```

---

## Self-Review — spec coverage

| Requirement | Task |
|---|---|
| Wheel renders from engine data, replays engine pocket (§4 source-of-truth) | 2, 3 |
| Seeded game; engine decides before animation (event-paced) (§4, §6) | 1, 3 |
| Approved physics feel (decelerating ~10s, glow, rest inward) | 2 |
| Paced reveal: result hidden until animation completes (§6) | 3 |
| History strip + result, persisted (§2.3 history seed) | 1, 3 |
| `prefers-reduced-motion` snaps (§9) | 2, 3, 4 |
| Render-verification: glowing pocket == revealed number (§4 browser smoke) | 4 |
| a11y AA incl. canvas accessible name + result announce (§9) | 4 |

**Deferred to Plan 2c:** the betting mat, chip placement, bets→stake→settle→bankroll accounting, history/analysis pages, advisor.

## Execution Handoff

After 2b is green, **Plan 2c (the mat & play loop)** adds the betting layout, chip placement, and the full bets→spin→settle→bankroll cycle — at which point the trainer is genuinely playable.
