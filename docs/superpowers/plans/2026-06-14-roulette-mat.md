# Roulette Betting Mat & Play Loop — Implementation Plan (Plan 2c of the UI phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the table genuinely playable: a betting mat where you place chips on the layout, a chip tray + controls (Spin / Clear / Repeat), and the full **place → spin → settle → bankroll** cycle settled by the engine. After this, a session is a real game of roulette against a provably-fair wheel.

**Architecture:** Bankroll accounting uses the **deduct-at-placement** model — placing a chip subtracts its value from the bankroll immediately (so you can't over-bet and the stack always shows available funds); on settle, the engine's per-bet `returnCents` (stake + winnings for wins, half-back for La Partage/Surrender, 0 for losses) is added back. The existing event-paced spin is unchanged: `computeSpin()` settles `store.bets` via the engine, the wheel animates, `commitSpin()` reveals + pays. Bets persist (already in the session schema), so a mid-bet refresh restores chips + the matching reduced bankroll.

**Scope:** straight-up (click a number) + all outside bets (red/black/odd/even/1–18/19–36/dozen/column) + the zero(s). **Deferred to a polish follow-up:** chip-on-line inside bets (split/street/corner/six-line/First-Five) which need edge/corner hit-geometry; per-bet table-max enforcement; the Analysis & Learn pages (a minimal History page is included here).

**Tech Stack:** Vue 3 SFC + CSS grid for the mat (DOM, not canvas — crisp labels + easy hit zones) · Pinia · the pure engine.

**Visual reference:** the betting-mat tab in `.superpowers/brainstorm/16915-1781372333/content/wheel-physics-v6.html` (the approved layout, hover→coverage). Port its layout; add click-to-place + chip stacks.

**Engine/app context:** `app/engine/bets.ts` (`BetType`, `COLUMNS`, `DOZENS`, `Bet`, `coverage`), `app/engine/wheel.ts` (`WHEEL_ORDER`, `colorOf`, `Pocket`), store `app/stores/roulette.ts` (`useRouletteStore` with `bets`, `bankrollCents`, `selectedChipCents`, `variant`, `phase`, `computeSpin`, `commitSpin`, `readyForNextSpin`), `roulette.config.ts` (`rouletteConfig.chips`), `app/utils/format.ts` (`formatCents`).

**Conventions:** Conventional Commits, NO AI trailer. Integer cents. Engine never imports Vue. `pnpm test` / `NODE_OPTIONS=--max-old-space-size=8192 pnpm typecheck` / `pnpm lint` green before each commit. **Reference-but-don't-edit** the sibling repos under `/Volumes/satechi/webdev/`.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/stores/roulette.ts` (modify) | `placeBet` / `clearBets` / `repeatLastBet`, `totalStakedCents`, deduct-at-placement, settle via `totalReturnCents` |
| `app/components/wheel/RouletteMat.vue` (create) | The betting layout; emits `place(descriptor)`; renders chip totals per zone |
| `app/components/wheel/ChipTray.vue` (create) | Denomination selector bound to `selectedChipCents` |
| `app/components/wheel/BetControls.vue` (create) | Spin / Clear bets / Repeat last + total-staked readout |
| `app/pages/wheel.vue` (modify) | Compose wheel + mat + tray + controls; the place→spin→settle flow + win/loss banner |
| `app/pages/history.vue` (create) | Spin log + session summary (the bottom-nav link) |
| `test/unit/store-bets.test.ts` (create) | Betting accounting (seeded, deterministic) |
| `test/nuxt/roulette-mat.test.ts` (create) | Mat renders zones; clicking emits the right descriptor |

---

## Task 1: Store — betting actions + settle accounting

**Files:** Modify `app/stores/roulette.ts`; Create `test/unit/store-bets.test.ts`.

- [ ] **Step 1: Write failing test `test/unit/store-bets.test.ts`:**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'

beforeEach(() => setActivePinia(createPinia()))

function freshStore(seed: number) {
  const s = useRouletteStore()
  s.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 100_000, selectedChipCents: 500 }, seed)
  return s
}

describe('store betting', () => {
  it('placeBet deducts the stake immediately and merges chips on the same zone', () => {
    const s = freshStore(1)
    expect(s.placeBet({ type: 'red', numbers: [] }, 500)).toBe(true)
    expect(s.bankrollCents).toBe(99_500)
    s.placeBet({ type: 'red', numbers: [] }, 500)        // same zone → merge
    expect(s.bankrollCents).toBe(99_000)
    expect(s.bets.length).toBe(1)
    expect(s.bets[0]!.stakeCents).toBe(1000)
    expect(s.totalStakedCents).toBe(1000)
  })

  it('rejects a bet larger than the bankroll', () => {
    const s = freshStore(1)
    expect(s.placeBet({ type: 'straight', numbers: [7] }, 200_000)).toBe(false)
    expect(s.bankrollCents).toBe(100_000)
    expect(s.bets.length).toBe(0)
  })

  it('clearBets refunds all stakes', () => {
    const s = freshStore(1)
    s.placeBet({ type: 'straight', numbers: [7] }, 500)
    s.placeBet({ type: 'black', numbers: [] }, 1000)
    s.clearBets()
    expect(s.bankrollCents).toBe(100_000)
    expect(s.bets.length).toBe(0)
  })

  it('settles a round: a winning straight returns stake + 35x, history + stats update', () => {
    // find a seed whose first european spin lands on 7
    const { simulateSpin } = require('../../app/engine/physics')
    const { mulberry32 } = require('../../app/engine/prng')
    let seed = 0
    while (simulateSpin(mulberry32(seed), 'single').pocket !== 7) seed++
    const s = freshStore(seed)
    s.placeBet({ type: 'straight', numbers: [7] }, 500)   // bankroll now 99_500
    const result = s.computeSpin()
    expect(result.pocket).toBe(7)
    s.commitSpin(result)
    // returned 500 + 17500 = 18000 → bankroll 99_500 + 18_000 = 117_500
    expect(s.bankrollCents).toBe(117_500)
    expect(s.spinHistory[0]!.pocket).toBe(7)
    expect(s.sessionStats.spins).toBe(1)
    expect(s.sessionStats.wageredCents).toBe(500)
    expect(s.bets.length).toBe(0)            // bets cleared after settle
    expect(s.lastRoundBets.length).toBe(1)   // remembered for Repeat
  })
})
```
(Note: the `require` in a test is acceptable here for the seed search; if the ESM runtime rejects it, use top-level `import { simulateSpin } from '../../app/engine/physics'` / `import { mulberry32 } from '../../app/engine/prng'` instead.)

- [ ] **Step 2: Run `pnpm test:unit` — expect FAIL.**

- [ ] **Step 3: Modify `app/stores/roulette.ts`:**
  - Add `import type { BetType } from '../engine/bets'` (and ensure `Bet`, `Pocket` are imported — `Bet` already is).
  - Add to `state`: `lastRoundBets: [] as Bet[],`.
  - Add a getter: `totalStakedCents: s => s.bets.reduce((a, b) => a + b.stakeCents, 0),`.
  - Add a module-level helper above the store:
    ```ts
    function sameNumbers(a: Pocket[], b: Pocket[]): boolean {
      if (a.length !== b.length) return false
      const sa = [...a].map(String).sort()
      const sb = [...b].map(String).sort()
      return sa.every((v, i) => v === sb[i])
    }
    ```
  - Change `commitSpin` so it pays the engine's per-bet returns (stakes already left at placement), remembers the bets for Repeat, and clears the table:
    ```ts
    commitSpin(result: RoundResult) {
      this.bankrollCents += result.totalReturnCents   // stakes were deducted at placement
      this.spinHistory.unshift({ pocket: result.pocket, netCents: result.netCents })
      this.spinHistory = this.spinHistory.slice(0, 50)
      this.sessionStats.spins += 1
      this.sessionStats.wageredCents += result.totalStakeCents
      this.sessionStats.netCents += result.netCents
      this.revealPocket = result.pocket
      this.lastRoundBets = this.bets
      this.bets = []
      this.phase = 'resolved'
      this.saveToLocalStorage()
    },
    ```
  - Add actions:
    ```ts
    placeBet(descriptor: { type: BetType, numbers: Pocket[] }, stakeCents: number): boolean {
      if (this.phase !== 'betting' && this.phase !== 'resolved') return false
      if (this.phase === 'resolved') { this.bets = []; this.phase = 'betting' }
      if (stakeCents <= 0 || stakeCents > this.bankrollCents) return false
      const existing = this.bets.find(b => b.type === descriptor.type && sameNumbers(b.numbers, descriptor.numbers))
      if (existing) existing.stakeCents += stakeCents
      else this.bets.push({ type: descriptor.type, numbers: [...descriptor.numbers], stakeCents })
      this.bankrollCents -= stakeCents
      this.saveToLocalStorage()
      return true
    },
    clearBets() {
      for (const b of this.bets) this.bankrollCents += b.stakeCents
      this.bets = []
      this.saveToLocalStorage()
    },
    repeatLastBet(): boolean {
      if (this.lastRoundBets.length === 0) return false
      const total = this.lastRoundBets.reduce((a, b) => a + b.stakeCents, 0)
      if (total > this.bankrollCents) return false
      const toReplace = this.lastRoundBets
      for (const b of toReplace) this.placeBet({ type: b.type, numbers: b.numbers }, b.stakeCents)
      return true
    },
    ```
  - `setSelectedChip(cents: number) { this.selectedChipCents = cents }`.

- [ ] **Step 4: Run `pnpm test:unit` — expect PASS** (43: 39 prior + 4 new).

- [ ] **Step 5: Quality gates** (typecheck + lint clean).

- [ ] **Step 6: Commit**

```bash
git add app/stores/roulette.ts test/unit/store-bets.test.ts
git commit -m "feat(ui): betting actions + deduct-at-placement settle accounting"
```

---

## Task 2: The betting mat component

**Files:** Create `app/components/wheel/RouletteMat.vue`; Test `test/nuxt/roulette-mat.test.ts`.

- [ ] **Step 1: Write the failing test `test/nuxt/roulette-mat.test.ts`:**

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RouletteMat from '../../app/components/wheel/RouletteMat.vue'

describe('RouletteMat', () => {
  it('renders all 36 numbers plus the zero for single-zero', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [] } })
    const txt = w.text()
    for (const n of [0, 1, 17, 36]) expect(txt).toContain(String(n))
    expect(w.text()).toContain('00') // ← should NOT be present for single-zero; flip this assertion:
  })
  it('emits place with a straight descriptor when a number is clicked', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [] } })
    const cell = w.findAll('[data-zone]').find(el => el.attributes('data-zone') === 'straight:7')
    expect(cell).toBeTruthy()
    await cell!.trigger('click')
    const ev = w.emitted('place')
    expect(ev).toBeTruthy()
    expect(ev![0]![0]).toMatchObject({ type: 'straight', numbers: [7] })
  })
})
```
  Fix the first test before running: single-zero must NOT contain `00`. Use:
  ```ts
  it('renders 1–36 and a single green zero (no 00)', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [] } })
    const zones = w.findAll('[data-zone]').map(z => z.attributes('data-zone'))
    expect(zones).toContain('straight:0')
    expect(zones).toContain('straight:36')
    expect(zones).not.toContain('straight:00')
  })
  ```

- [ ] **Step 2: Run `pnpm test:nuxt` — expect FAIL.**

- [ ] **Step 3: Create `app/components/wheel/RouletteMat.vue`.** A CSS-grid layout that renders zones and emits `place`. Build it like this:

  **Props:** `{ variant: 'single' | 'double'; bets: Bet[] }`. **Emits:** `place(descriptor: { type: BetType; numbers: Pocket[] })`.

  Each clickable zone has a `data-zone` attribute (the test relies on it) of the form `"<type>:<numbers-joined>"` (e.g. `straight:7`, `red:`, `column:1,4,7,...`). On click, emit `{ type, numbers }`. Render a chip badge on any zone whose matching bet (same type + same numbers) has stake > 0, showing `formatCents(stake)`.

  Layout (horizontal, standard): a left zero column (0, plus 00 for double), the 12×3 number grid (top row 3,6,…,36; middle 2,5,…,35; bottom 1,4,…,34), a right column of three 2:1 column bets, then a dozens row (1st/2nd/3rd 12) and an even-money row (1–18, EVEN, RED, BLACK, ODD, 19–36). Numbers colored via `colorOf` (red `var(--chip-red)`, black `#1c1c1c`, green `var(--chip-green)`). Use `COLUMNS`/`DOZENS` from `~/engine/bets` for those descriptors. Build the number cells with `v-for`. Keep it keyboard-operable: each zone is a `<button type="button">` with an `:aria-label` (e.g. `"Straight up 7"`, `"Red"`, `"First dozen"`).

  Helper to render the chip total for a zone:
  ```ts
  function stakeOn(type: BetType, numbers: Pocket[]): number {
    const b = props.bets.find(x => x.type === type && sameNumbers(x.numbers, numbers))
    return b ? b.stakeCents : 0
  }
  ```
  (Reuse a local `sameNumbers` like the store's.)

  Skeleton:
  ```vue
  <script setup lang="ts">
  import { colorOf, type Pocket } from '~/engine/wheel'
  import { COLUMNS, DOZENS, type BetType } from '~/engine/bets'
  import { formatCents } from '~/utils/format'

  const props = defineProps<{ variant: 'single' | 'double'; bets: { type: BetType; numbers: Pocket[]; stakeCents: number }[] }>()
  const emit = defineEmits<{ place: [{ type: BetType; numbers: Pocket[] }] }>()

  const cells = [3, 2, 1].flatMap(r => Array.from({ length: 12 }, (_, c) => c * 3 + r)) // grid order
  const numColor: Record<string, string> = { red: 'var(--chip-red)', black: '#1c1c1c', green: 'var(--chip-green)' }
  function sameNumbers(a: Pocket[], b: Pocket[]): boolean { /* as in the store */ return a.length === b.length && [...a].map(String).sort().every((v, i) => v === [...b].map(String).sort()[i]) }
  function stakeOn(type: BetType, numbers: Pocket[]): number {
    const found = props.bets.find(x => x.type === type && sameNumbers(x.numbers, numbers))
    return found ? found.stakeCents : 0
  }
  function place(type: BetType, numbers: Pocket[]) { emit('place', { type, numbers }) }
  </script>
  ```
  Render the template using these (zero column, number grid via `v-for="n in cells"`, the outside rows). Keep it compact and styled with the felt/cream/gold tokens. Every interactive zone: `<button type="button" :data-zone="`straight:${n}`" :aria-label="`Straight up ${n}`" @click="place('straight', [n])"> … </button>` and similar for the outside zones.

- [ ] **Step 4: Run `pnpm test:nuxt` — expect PASS.**

- [ ] **Step 5: Quality gates** (typecheck + lint).

- [ ] **Step 6: Commit**

```bash
git add app/components/wheel/RouletteMat.vue test/nuxt/roulette-mat.test.ts
git commit -m "feat(ui): clickable betting mat (straight + outside bets) with chip stacks"
```

---

## Task 3: Chip tray, controls, and the full play loop on `/wheel`

**Files:** Create `app/components/wheel/ChipTray.vue`, `app/components/wheel/BetControls.vue`; Modify `app/pages/wheel.vue`.

- [ ] **Step 1: Create `app/components/wheel/ChipTray.vue`** — render `rouletteConfig.chips` as selectable chips (the selected one highlighted with a ring); emit `select(cents)`; show `formatCents`. Props `{ selected: number }`, emits `select`.

- [ ] **Step 2: Create `app/components/wheel/BetControls.vue`** — three buttons: **Spin** (primary; `:disabled="spinning || totalStaked === 0"`), **Clear** (`:disabled="spinning || totalStaked === 0"`), **Repeat** (`:disabled="spinning || !canRepeat"`); plus a "Staked: {{ formatCents(totalStaked) }}" readout. Props `{ spinning: boolean; totalStaked: number; canRepeat: boolean }`, emits `spin`, `clear`, `repeat`.

- [ ] **Step 3: Modify `app/pages/wheel.vue`** — compose everything and wire the loop. The felt area becomes: the `RouletteWheel` (top), then `ResultBadge`, then the `RouletteMat` (clickable), the `ChipTray`, and `BetControls`. Keep the explicit imports pattern (the auto-import-prefix bug from 2b): import `RouletteMat`, `ChipTray`, `BetControls` explicitly.

  Wire-up (`<script setup>`):
  ```ts
  // existing imports + explicit component imports for RouletteWheel, ResultBadge, RouletteMat, ChipTray, BetControls
  const lastNet = ref<number | null>(null)

  function onPlace(descriptor: { type: BetType; numbers: Pocket[] }) {
    store.placeBet(descriptor, store.selectedChipCents)
  }
  async function spin() {
    if (store.phase === 'spinning' || store.totalStakedCents === 0 || !wheelRef.value) return
    const result = store.computeSpin()
    await wheelRef.value.spinTo(result.pocket)
    store.commitSpin(result)
    lastNet.value = result.netCents
    store.readyForNextSpin()
  }
  ```
  Add a transient win/loss banner driven by `lastNet` (e.g. green `+{{ formatCents(lastNet) }}` when > 0, neutral "no win" when ≤ 0), shown after a spin. Pass `:bets="store.bets"` to the mat, `:selected="store.selectedChipCents"` to the tray (`@select="store.setSelectedChip"`), and `:total-staked="store.totalStakedCents" :spinning="store.phase==='spinning'" :can-repeat="store.lastRoundBets.length>0"` to the controls (`@spin="spin" @clear="store.clearBets" @repeat="store.repeatLastBet"`). The Spin button moves into `BetControls`; remove the standalone one from 2b.

- [ ] **Step 4: Verify compile** — boot `timeout 80 pnpm dev`; confirm `/wheel` compiles cleanly. `pnpm test` (43), typecheck, lint green.

- [ ] **Step 5: Commit**

```bash
git add app/components/wheel/ChipTray.vue app/components/wheel/BetControls.vue app/pages/wheel.vue
git commit -m "feat(ui): chip tray + controls + the full place→spin→settle→bankroll loop"
```

---

## Task 4: History page + browser smoke + a11y

**Files:** Create `app/pages/history.vue`; verification.

- [ ] **Step 1: Create `app/pages/history.vue`** — `onMounted` load session or redirect to `/`. Show session summary (spins, total wagered, net P&L via `formatCents`/`formatSignedCents`, current bankroll) and the spin log (`store.spinHistory`: each row a colored number + its net). Use the same chrome (it's inside the default layout). Keep it simple and a11y-clean.

- [ ] **Step 2: Browser smoke (drive the real app, watch the console):**
  - Setup → `/wheel`. Select a chip; click **Red**, click **7**, click a **dozen** → chips appear on those zones, **bankroll drops** by the staked total, "Staked" shows the sum.
  - **Spin** → wheel animates, lands on the engine's pocket (glow == badge), **bankroll updates by the engine's settlement** (cross-check: a winning straight pays 35:1, a winning red pays 1:1, losers are collected), the win/loss banner shows the net, the history strip + History page update.
  - **Clear** refunds to the bankroll; **Repeat** re-places the previous bets (if affordable); over-betting is impossible (a chip larger than the bankroll is rejected).
  - **Refresh mid-bet** → chips + the reduced bankroll restore together.
  - Reduced-motion → spin snaps; result still settles correctly.
  - Console clean.
- [ ] **Step 3: a11y** — `lightcap run_a11y` on `/wheel` (with a session) and `/history`; resolve any AA issue (zones are real `<button>`s with aria-labels; chips need sufficient contrast). Target 100.
- [ ] **Step 4: Quality gates** — `pnpm test` (43), typecheck, lint green.
- [ ] **Step 5: Commit fixes**

```bash
git add -A
git commit -m "feat(ui): history page + betting play-loop browser-smoke/a11y fixes"
```

---

## Self-Review — spec coverage

| Requirement | Task |
|---|---|
| Place wagers on the layout (§5 placement) | 2, 3 |
| Bets settled by the engine; bankroll moves correctly (§4, §6) | 1, 3 |
| Deduct-at-placement; no over-betting; clear/repeat | 1, 3 |
| Chips persist mid-bet; refresh restores bets + bankroll (§6) | 1, 4 |
| History surface seeded (§2.3) | 4 |
| Reduced-motion + a11y AA (real buttons, aria) (§9) | 2, 3, 4 |
| Render-verification: settlement matches the glowing pocket (§4) | 4 |

**Deferred (noted):** chip-on-line inside bets (split/street/corner/six-line/First-Five); per-bet table-max; the Analysis & Learn pages; the advisor/feedback/drills (the trainer surfaces — Plan 3).

## Execution Handoff

After 2c, the table is **playable end to end**. The next phase is the **trainer** (Plan 3): the EV advisor, per-decision feedback, analysis, and the Lab — the layer that turns a playable game into a teaching tool.
