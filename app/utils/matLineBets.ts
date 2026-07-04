import type { BetType } from '../engine/bets'
import type { Pocket, Variant } from '../engine/wheel'

/**
 * Pure geometry for the inside-combination bet hotspots that sit on the gap
 * lines between the number cells of the betting mat.
 *
 * The number grid is 12 columns × 3 rows of 42×34px cells separated by 3px
 * gaps. Origin = top-left of the grid. Grid width = 12*42 + 11*3 = 537,
 * height = 3*34 + 2*3 = 108.
 *
 * Cell at grid position (column c ∈ 0..11 left→right, row i ∈ 0..2 top→bottom)
 * holds `numAt(c, i)` — so the top row is 3,6,…,36; the middle 2,5,…,35; the
 * bottom 1,4,…,34, matching the printed layout.
 */
export const CW = 42
export const CH = 34
export const GAP = 3
export const COLP = 45 // column pitch (cell + gap)
export const ROWP = 37 // row pitch (cell + gap)

export function numAt(c: number, i: number): number {
  return 3 * c + 3 - i
}

export interface Hotspot {
  type: BetType
  numbers: Pocket[]
  cx: number
  cy: number
  w: number
  h: number
}

const asc = (a: number, b: number): number => a - b

export function lineBetHotspots(variant: Variant): Hotspot[] {
  const spots: Hotspot[] = []

  // Vertical splits (33): the shared vertical edge between two side-by-side cells.
  for (let c = 0; c <= 10; c++) {
    for (let i = 0; i <= 2; i++) {
      spots.push({
        type: 'split',
        numbers: [numAt(c, i), numAt(c + 1, i)].sort(asc),
        cx: c * COLP + CW + GAP / 2, // = c*45 + 43.5
        cy: i * ROWP + CH / 2, // = i*37 + 17
        w: 18,
        h: 24
      })
    }
  }

  // Horizontal splits (24): the shared horizontal edge between two stacked cells.
  for (let c = 0; c <= 11; c++) {
    for (let i = 0; i <= 1; i++) {
      spots.push({
        type: 'split',
        numbers: [numAt(c, i), numAt(c, i + 1)].sort(asc),
        cx: c * COLP + CW / 2, // = c*45 + 21
        cy: i * ROWP + CH + GAP / 2, // = i*37 + 35.5
        w: 28,
        h: 16
      })
    }
  }

  // Corners (22): the four-cell intersection point.
  for (let c = 0; c <= 10; c++) {
    for (let i = 0; i <= 1; i++) {
      spots.push({
        type: 'corner',
        numbers: [numAt(c, i), numAt(c + 1, i), numAt(c, i + 1), numAt(c + 1, i + 1)].sort(asc),
        cx: c * COLP + CW + GAP / 2, // = c*45 + 43.5
        cy: i * ROWP + CH + GAP / 2, // = i*37 + 35.5
        w: 18,
        h: 18
      })
    }
  }

  // Streets (12): the bottom edge of a column — its three numbers.
  for (let c = 0; c <= 11; c++) {
    spots.push({
      type: 'street',
      numbers: [3 * c + 1, 3 * c + 2, 3 * c + 3],
      cx: c * COLP + CW / 2, // = c*45 + 21
      cy: 108,
      w: 30,
      h: 14
    })
  }

  // Six-lines (11): the bottom corner between two adjacent streets — six numbers.
  for (let c = 0; c <= 10; c++) {
    spots.push({
      type: 'sixline',
      numbers: [3 * c + 1, 3 * c + 2, 3 * c + 3, 3 * c + 4, 3 * c + 5, 3 * c + 6],
      cx: c * COLP + CW + GAP / 2, // = c*45 + 43.5
      cy: 108,
      w: 18,
      h: 14
    })
  }

  // First Five (double-zero wheels only): 0, 00, 1, 2, 3 — straddles the left edge.
  if (variant === 'double') {
    spots.push({
      type: 'firstFive',
      numbers: [0, '00', 1, 2, 3],
      cx: 0,
      cy: 54,
      w: 14,
      h: 80
    })
  }

  // Zero-adjacent bets (single-zero layout only — Crown Melbourne Diagram D).
  // The 0 box spans all three rows to the LEFT of the grid, so these sit on the
  // grid's left edge (cx = 0), straddling the gap toward the zero cell. On the
  // double-zero layout the zero geometry differs (0 and 00 each touch other
  // numbers), so these hotspots are not offered there.
  if (variant === 'single') {
    // Splits 0–3 / 0–2 / 0–1 beside the top / middle / bottom rows — split odds.
    for (let i = 0; i <= 2; i++) {
      spots.push({
        type: 'split',
        numbers: [0, numAt(0, i)],
        cx: 0,
        cy: i * ROWP + CH / 2, // 17 / 54 / 91
        w: 14,
        h: 24
      })
    }
    // Trios 0–2–3 and 0–1–2: zero plus a shared row boundary — street odds.
    spots.push({ type: 'street', numbers: [0, 2, 3], cx: 0, cy: CH + GAP / 2, w: 14, h: 16 }) // 35.5
    spots.push({ type: 'street', numbers: [0, 1, 2], cx: 0, cy: ROWP + CH + GAP / 2, w: 14, h: 16 }) // 72.5
    // First Four (0,1,2,3): zero plus the 1–2–3 street line — corner odds.
    spots.push({ type: 'corner', numbers: [0, 1, 2, 3], cx: 0, cy: 108, w: 14, h: 14 })
  }

  return spots
}
