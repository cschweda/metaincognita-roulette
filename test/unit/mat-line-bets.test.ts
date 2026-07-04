import { describe, it, expect } from 'vitest'
import { lineBetHotspots, numAt, type Hotspot } from '../../app/utils/matLineBets'
import type { Pocket } from '../../app/engine/wheel'

const byType = (spots: Hotspot[], type: string): Hotspot[] => spots.filter(s => s.type === type)

// Find a grid hotspot (split/corner/street/sixline) by its exact number set.
function withNumbers(spots: Hotspot[], type: string, numbers: Pocket[]): Hotspot | undefined {
  const key = (ns: Pocket[]) => ns.map(String).join(',')
  return spots.find(s => s.type === type && key(s.numbers) === key(numbers))
}

describe('numAt', () => {
  it('lays the grid out top→bottom 3/2/1 per column', () => {
    expect(numAt(0, 0)).toBe(3)
    expect(numAt(0, 1)).toBe(2)
    expect(numAt(0, 2)).toBe(1)
    expect(numAt(11, 0)).toBe(36)
    expect(numAt(3, 2)).toBe(10)
  })
})

describe('lineBetHotspots — counts', () => {
  it('single-zero: 108 hotspots (incl. zero splits, trios, First Four) and NO First Five', () => {
    const spots = lineBetHotspots('single')
    expect(byType(spots, 'split').length).toBe(33 + 24 + 3) // + 0–1, 0–2, 0–3
    expect(byType(spots, 'corner').length).toBe(22 + 1) // + First Four (0,1,2,3)
    expect(byType(spots, 'street').length).toBe(12 + 2) // + trios 0–1–2, 0–2–3
    expect(byType(spots, 'sixline').length).toBe(11)
    expect(byType(spots, 'firstFive').length).toBe(0)
    expect(spots.length).toBe(108)
  })

  it('double-zero: 103 hotspots including a single First Five', () => {
    const spots = lineBetHotspots('double')
    expect(byType(spots, 'firstFive').length).toBe(1)
    expect(spots.length).toBe(103)
  })
})

describe('lineBetHotspots — single-zero zero-adjacent bets (Crown layout)', () => {
  const single = lineBetHotspots('single')

  it('offers the three zero splits at regulated split odds', () => {
    expect(withNumbers(single, 'split', [0, 1])).toBeDefined()
    expect(withNumbers(single, 'split', [0, 2])).toBeDefined()
    expect(withNumbers(single, 'split', [0, 3])).toBeDefined()
  })

  it('offers both trios as street-priced three-number bets', () => {
    expect(withNumbers(single, 'street', [0, 1, 2])).toBeDefined()
    expect(withNumbers(single, 'street', [0, 2, 3])).toBeDefined()
  })

  it('offers the First Four (0,1,2,3) at corner odds', () => {
    expect(withNumbers(single, 'corner', [0, 1, 2, 3])).toBeDefined()
  })

  it('places them on the zero boundary: x at the grid left edge, rows top→bottom 3/2/1', () => {
    expect(withNumbers(single, 'split', [0, 3])!.cy).toBe(17) // top row (3)
    expect(withNumbers(single, 'split', [0, 2])!.cy).toBe(54) // middle row (2)
    expect(withNumbers(single, 'split', [0, 1])!.cy).toBe(91) // bottom row (1)
    expect(withNumbers(single, 'street', [0, 2, 3])!.cy).toBe(35.5) // 3/2 boundary
    expect(withNumbers(single, 'street', [0, 1, 2])!.cy).toBe(72.5) // 2/1 boundary
    for (const numbers of [[0, 1], [0, 2], [0, 3]] as Pocket[][]) {
      expect(withNumbers(single, 'split', numbers)!.cx).toBe(0)
    }
    expect(withNumbers(single, 'corner', [0, 1, 2, 3])!.cx).toBe(0)
  })

  it('does not offer them on the double-zero layout (different zero geometry)', () => {
    const double = lineBetHotspots('double')
    expect(withNumbers(double, 'split', [0, 1])).toBeUndefined()
    expect(withNumbers(double, 'street', [0, 1, 2])).toBeUndefined()
    expect(withNumbers(double, 'corner', [0, 1, 2, 3])).toBeUndefined()
  })
})

describe('lineBetHotspots — specific number sets', () => {
  const single = lineBetHotspots('single')

  it('vertical split c0,i2 → [1,4]', () => {
    expect(withNumbers(single, 'split', [1, 4])).toBeDefined()
  })

  it('horizontal split c0,i0 → [2,3]', () => {
    expect(withNumbers(single, 'split', [2, 3])).toBeDefined()
  })

  it('corner c0,i0 → [2,3,5,6]', () => {
    const hs = withNumbers(single, 'corner', [2, 3, 5, 6])
    expect(hs).toBeDefined()
    expect(hs!.numbers).toEqual([2, 3, 5, 6])
  })

  it('street c0 → [1,2,3] and street c3 → [10,11,12]', () => {
    expect(withNumbers(single, 'street', [1, 2, 3])).toBeDefined()
    expect(withNumbers(single, 'street', [10, 11, 12])).toBeDefined()
  })

  it('sixline c0 → [1,2,3,4,5,6]', () => {
    expect(withNumbers(single, 'sixline', [1, 2, 3, 4, 5, 6])).toBeDefined()
  })

  it('First Five is present only for double-zero, with [0,00,1,2,3]', () => {
    const ff = byType(lineBetHotspots('double'), 'firstFive')[0]
    expect(ff).toBeDefined()
    expect(ff!.numbers).toEqual([0, '00', 1, 2, 3])
    expect(byType(single, 'firstFive').length).toBe(0)
  })
})

describe('lineBetHotspots — geometry placement', () => {
  const single = lineBetHotspots('single')

  it('vertical split sits on the vertical gap line at the cells’ mid-row', () => {
    // c0,i0 spans cells at columns 0 and 1, top row → center-x in the 3px gap.
    const hs = withNumbers(single, 'split', [3, 6])!
    expect(hs.cx).toBe(43.5) // 0*45 + 42 + 1.5 — the gap centre
    expect(hs.cy).toBe(17) // 0*37 + 17 — top-row centre
  })

  it('corner sits at the four-cell intersection', () => {
    const hs = withNumbers(single, 'corner', [2, 3, 5, 6])!
    expect(hs.cx).toBe(43.5) // vertical gap between cols 0 and 1
    expect(hs.cy).toBe(35.5) // horizontal gap between rows 0 and 1
  })
})
