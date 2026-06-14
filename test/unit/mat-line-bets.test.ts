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
  it('single-zero: 102 hotspots and NO First Five', () => {
    const spots = lineBetHotspots('single')
    expect(byType(spots, 'split').length).toBe(33 + 24) // 57
    expect(byType(spots, 'corner').length).toBe(22)
    expect(byType(spots, 'street').length).toBe(12)
    expect(byType(spots, 'sixline').length).toBe(11)
    expect(byType(spots, 'firstFive').length).toBe(0)
    expect(spots.length).toBe(102)
  })

  it('double-zero: 103 hotspots including a single First Five', () => {
    const spots = lineBetHotspots('double')
    expect(byType(spots, 'firstFive').length).toBe(1)
    expect(spots.length).toBe(103)
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
