<template>
  <div class="mat">
    <!-- Top row: zero column + number grid + 2:1 column bets -->
    <div class="mat-top">
      <!-- Zero column -->
      <div class="zero-col">
        <button
          type="button"
          class="cell cell-green"
          :class="{ 'cell-single-zero': variant === 'single', 'covered': isCovered(0), 'preview': isPreview(0) }"
          data-zone="straight:0"
          aria-label="Straight up 0"
          @click="place('straight', [0])"
        >
          0
          <span
            v-if="stakeOn('straight', [0]) > 0"
            class="chip-badge"
          >{{ formatCents(stakeOn('straight', [0])) }}</span>
        </button>
        <button
          v-if="variant === 'double'"
          type="button"
          class="cell cell-green cell-double-zero"
          :class="{ covered: isCovered('00'), preview: isPreview('00') }"
          data-zone="straight:00"
          aria-label="Straight up 00"
          @click="place('straight', ['00'])"
        >
          00
          <span
            v-if="stakeOn('straight', ['00']) > 0"
            class="chip-badge"
          >{{ formatCents(stakeOn('straight', ['00'])) }}</span>
        </button>
      </div>

      <!-- Number grid: 12 columns × 3 rows, top row = 3,6,9,...,36 -->
      <div class="num-grid">
        <div
          v-for="col in 12"
          :key="col"
          class="num-col"
        >
          <button
            v-for="row in [3, 2, 1]"
            :key="row"
            type="button"
            class="cell"
            :class="[numClass(col * 3 - (3 - row)), { covered: isCovered(col * 3 - (3 - row)), preview: isPreview(col * 3 - (3 - row)) }]"
            :data-zone="`straight:${col * 3 - (3 - row)}`"
            :aria-label="`Straight up ${col * 3 - (3 - row)}`"
            @click="place('straight', [col * 3 - (3 - row)])"
          >
            {{ col * 3 - (3 - row) }}
            <span
              v-if="stakeOn('straight', [col * 3 - (3 - row)]) > 0"
              class="chip-badge"
            >
              {{ formatCents(stakeOn('straight', [col * 3 - (3 - row)])) }}
            </span>
          </button>
        </div>

        <!-- Inside-combination bet hotspots overlay (on the gap lines between cells).
             The layer is pointer-events:none; only the buttons capture clicks/drops,
             so the straight-up cells underneath stay clickable at their centres. -->
        <div class="line-overlay">
          <button
            v-for="(hs, i) in hotspots"
            :key="`${hs.type}-${hs.numbers.join('_')}-${i}`"
            type="button"
            class="line-hotspot"
            :class="`line-${hs.type}`"
            :style="{
              left: (hs.cx - hs.w / 2) + 'px',
              top: (hs.cy - hs.h / 2) + 'px',
              width: hs.w + 'px',
              height: hs.h + 'px'
            }"
            :data-zone="`${hs.type}:${hs.numbers.join(',')}`"
            :aria-label="hotspotLabel(hs)"
            @click="place(hs.type, hs.numbers)"
            @mouseenter="previewOn(hs)"
            @mouseleave="previewOff"
          >
            <span
              v-if="stakeOn(hs.type, hs.numbers) > 0"
              class="line-chip"
            >{{ formatCents(stakeOn(hs.type, hs.numbers)) }}</span>
          </button>
        </div>
      </div>

      <!-- 2:1 Column bets (right column, top→bottom = COL_TOP, COL_MID, COL_BOT) -->
      <div class="col-bets">
        <button
          type="button"
          class="cell cell-col"
          :data-zone="`column:${COL_TOP.join(',')}`"
          aria-label="Top column"
          @click="place('column', COL_TOP)"
        >
          2:1
          <span
            v-if="stakeOn('column', COL_TOP) > 0"
            class="chip-badge"
          >
            {{ formatCents(stakeOn('column', COL_TOP)) }}
          </span>
        </button>
        <button
          type="button"
          class="cell cell-col"
          :data-zone="`column:${COL_MID.join(',')}`"
          aria-label="Middle column"
          @click="place('column', COL_MID)"
        >
          2:1
          <span
            v-if="stakeOn('column', COL_MID) > 0"
            class="chip-badge"
          >
            {{ formatCents(stakeOn('column', COL_MID)) }}
          </span>
        </button>
        <button
          type="button"
          class="cell cell-col"
          :data-zone="`column:${COL_BOT.join(',')}`"
          aria-label="Bottom column"
          @click="place('column', COL_BOT)"
        >
          2:1
          <span
            v-if="stakeOn('column', COL_BOT) > 0"
            class="chip-badge"
          >
            {{ formatCents(stakeOn('column', COL_BOT)) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Dozens row -->
    <div class="out-row dozens-row">
      <button
        type="button"
        class="cell cell-out"
        :data-zone="`dozen:${DOZ_1.join(',')}`"
        aria-label="First dozen"
        @click="place('dozen', DOZ_1)"
      >
        1st 12
        <span
          v-if="stakeOn('dozen', DOZ_1) > 0"
          class="chip-badge"
        >
          {{ formatCents(stakeOn('dozen', DOZ_1)) }}
        </span>
      </button>
      <button
        type="button"
        class="cell cell-out"
        :data-zone="`dozen:${DOZ_2.join(',')}`"
        aria-label="Second dozen"
        @click="place('dozen', DOZ_2)"
      >
        2nd 12
        <span
          v-if="stakeOn('dozen', DOZ_2) > 0"
          class="chip-badge"
        >
          {{ formatCents(stakeOn('dozen', DOZ_2)) }}
        </span>
      </button>
      <button
        type="button"
        class="cell cell-out"
        :data-zone="`dozen:${DOZ_3.join(',')}`"
        aria-label="Third dozen"
        @click="place('dozen', DOZ_3)"
      >
        3rd 12
        <span
          v-if="stakeOn('dozen', DOZ_3) > 0"
          class="chip-badge"
        >
          {{ formatCents(stakeOn('dozen', DOZ_3)) }}
        </span>
      </button>
    </div>

    <!-- Even-money row -->
    <div class="out-row even-row">
      <button
        type="button"
        class="cell cell-out"
        data-zone="low:"
        aria-label="1 to 18"
        @click="place('low', [])"
      >
        1 to 18
        <span
          v-if="stakeOn('low', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('low', [])) }}</span>
      </button>
      <button
        type="button"
        class="cell cell-out"
        data-zone="even:"
        aria-label="Even"
        @click="place('even', [])"
      >
        EVEN
        <span
          v-if="stakeOn('even', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('even', [])) }}</span>
      </button>
      <button
        type="button"
        class="cell cell-out cell-red-out"
        data-zone="red:"
        aria-label="Red"
        @click="place('red', [])"
      >
        RED
        <span
          v-if="stakeOn('red', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('red', [])) }}</span>
      </button>
      <button
        type="button"
        class="cell cell-out cell-black-out"
        data-zone="black:"
        aria-label="Black"
        @click="place('black', [])"
      >
        BLACK
        <span
          v-if="stakeOn('black', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('black', [])) }}</span>
      </button>
      <button
        type="button"
        class="cell cell-out"
        data-zone="odd:"
        aria-label="Odd"
        @click="place('odd', [])"
      >
        ODD
        <span
          v-if="stakeOn('odd', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('odd', [])) }}</span>
      </button>
      <button
        type="button"
        class="cell cell-out"
        data-zone="high:"
        aria-label="19 to 36"
        @click="place('high', [])"
      >
        19 to 36
        <span
          v-if="stakeOn('high', []) > 0"
          class="chip-badge"
        >{{ formatCents(stakeOn('high', [])) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { colorOf, type Pocket } from '~/engine/wheel'
import { COLUMNS, DOZENS, coverage, type BetType } from '~/engine/bets'
import { formatCents } from '~/utils/format'
import { betLabel } from '~/utils/betLabel'
import { lineBetHotspots, type Hotspot } from '~/utils/matLineBets'

const props = defineProps<{
  variant: 'single' | 'double'
  bets: { type: BetType, numbers: Pocket[], stakeCents: number }[]
}>()

const emit = defineEmits<{
  place: [descriptor: { type: BetType, numbers: Pocket[] }]
}>()

// Typed column / dozen slices — avoids noUncheckedIndexedAccess errors in template
const COL_TOP: Pocket[] = COLUMNS[2] as Pocket[]
const COL_MID: Pocket[] = COLUMNS[1] as Pocket[]
const COL_BOT: Pocket[] = COLUMNS[0] as Pocket[]
const DOZ_1: Pocket[] = DOZENS[0] as Pocket[]
const DOZ_2: Pocket[] = DOZENS[1] as Pocket[]
const DOZ_3: Pocket[] = DOZENS[2] as Pocket[]

function sameNumbers(a: Pocket[], b: Pocket[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].map(String).sort()
  const sb = [...b].map(String).sort()
  return sa.every((v, i) => v === sb[i])
}

function stakeOn(type: BetType, numbers: Pocket[]): number {
  const f = props.bets.find(x => x.type === type && sameNumbers(x.numbers, numbers))
  return f ? f.stakeCents : 0
}

function place(type: BetType, numbers: Pocket[]): void {
  emit('place', { type, numbers })
}

const COLOR_CLASS: Record<string, string> = {
  red: 'cell-red',
  black: 'cell-black',
  green: 'cell-green'
}

function numClass(n: number): string {
  return COLOR_CLASS[colorOf(n)] ?? 'cell-black'
}

// Union of every pocket the current bets cover — so the mat lights up what's in play.
const coveredPockets = computed(() => {
  const s = new Set<string>()
  for (const bet of props.bets) {
    for (const p of coverage(bet)) s.add(String(p))
  }
  return s
})
function isCovered(n: Pocket): boolean {
  return coveredPockets.value.has(String(n))
}

// Inside-combination bet hotspots (splits, streets, corners, six-lines, First Five)
// that sit on the gap lines between the number cells. Pure geometry from matLineBets.
const hotspots = computed<Hotspot[]>(() => lineBetHotspots(props.variant))

function hotspotLabel(hs: Hotspot): string {
  return betLabel({ type: hs.type, numbers: hs.numbers, stakeCents: 0 })
}

// Bonus: preview-light the cells a hotspot would cover while it's hovered.
const hoverNumbers = ref<Set<string>>(new Set())
function previewOn(hs: Hotspot): void {
  hoverNumbers.value = new Set(hs.numbers.map(String))
}
function previewOff(): void {
  hoverNumbers.value = new Set()
}
function isPreview(n: Pocket): boolean {
  return hoverNumbers.value.has(String(n))
}
</script>

<style scoped>
.mat {
  display: inline-block;
  background: var(--felt);
  border: 6px solid var(--walnut, #3a2417);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  min-width: 520px;
  font-family: var(--font-mono, 'Fira Code', monospace);
}

.mat-top {
  display: flex;
  gap: 3px;
  align-items: stretch;
}

/* Zero column */
.zero-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Number grid */
.num-grid {
  display: grid;
  grid-auto-flow: column;
  gap: 3px;
  position: relative;
}

/* Inside-combination bet hotspot overlay — sits on top of the cells, but only the
   hotspot buttons themselves capture pointer events (the layer passes them through). */
.line-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}

.line-hotspot {
  position: absolute;
  pointer-events: auto;
  background: transparent;
  border: 0;
  border-radius: 3px;
  padding: 0;
  cursor: pointer;
  transition: background 0.1s, box-shadow 0.1s;
}

.line-hotspot:hover {
  background: rgba(212, 168, 71, 0.3);
  box-shadow: inset 0 0 0 1px var(--gold, #d4a847);
}

.line-hotspot:focus-visible {
  outline: 2px solid var(--gold, #d4a847);
  outline-offset: 0;
  background: rgba(212, 168, 71, 0.2);
}

/* Chip badge for a placed inside-combination bet (mirrors .chip-badge, centred). */
.line-chip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--gold, #d4a847);
  color: #1a0a00;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 999px;
  pointer-events: none;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 7;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.num-col {
  display: grid;
  gap: 3px;
}

/* 2:1 column bets */
.col-bets {
  display: grid;
  gap: 3px;
}

/* Outside rows */
.out-row {
  display: grid;
  gap: 3px;
  margin-top: 3px;
}

.dozens-row {
  grid-template-columns: repeat(3, 1fr);
  margin-left: 49px;
}

.even-row {
  grid-template-columns: repeat(6, 1fr);
  margin-left: 49px;
}

/* Base cell */
.cell {
  width: 42px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  position: relative;
  border-radius: 2px;
  transition: opacity 0.1s, outline-offset 0.1s;
  outline: none;
}

.cell:hover {
  outline: 2px solid var(--gold, #d4a847);
  outline-offset: -2px;
  z-index: 3;
}

.cell:focus-visible {
  outline: 3px solid var(--gold, #d4a847);
  outline-offset: -3px;
  z-index: 4;
}

/* A covered number — lit up to show it's part of a live bet */
.cell.covered {
  box-shadow: inset 0 0 0 2px var(--gold, #d4a847), 0 0 7px rgba(212, 168, 71, 0.45);
  z-index: 2;
}

/* Preview outline — the cells a hovered hotspot would cover (lighter than .covered). */
.cell.preview {
  box-shadow: inset 0 0 0 1px rgba(212, 168, 71, 0.7);
  z-index: 2;
}

/* Number cell colors */
.cell-red {
  background: var(--chip-red, #c1272d);
}

.cell-black {
  background: #1c1c1c;
}

.cell-green {
  background: var(--chip-green, #1b7a43);
  width: auto;
  padding: 0 8px;
}

/* Single-zero takes full height of 3 number rows + 2 gaps */
.cell-single-zero {
  height: calc(3 * 34px + 2 * 3px);
}

/* Double-zero: two halves */
.cell-double-zero {
  height: calc(1.5 * 34px + 1 * 3px);
}

/* 2:1 column bets */
.cell-col {
  background: #0c4f2e;
  font-size: 12px;
  font-weight: 600;
  height: 34px;
  width: 42px;
}

/* Outside bets (dozens, even-money) */
.cell-out {
  background: #0c4f2e;
  border: 1px solid rgba(255, 255, 255, 0.32);
  font-size: 12.5px;
  font-weight: 600;
  width: auto;
  height: auto;
  min-height: 48px;
  padding: 10px 12px;
  line-height: 1.25;
  text-align: center;
}

.cell-red-out {
  background: var(--chip-red, #c1272d);
}

.cell-black-out {
  background: #1c1c1c;
}

/* Chip badge overlay */
.chip-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--gold, #d4a847);
  color: #1a0a00;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 999px;
  pointer-events: none;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
</style>
