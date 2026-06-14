import { describe, it, expect } from 'vitest'
import { makeDrillQuestion, type DrillQuestion } from '../../app/utils/drills'
import { PAYOUTS } from '../../app/engine/bets'
import { edgePct } from '../../app/engine/ev'

// Bet types whose distinct payouts power the payout drills, keyed by their
// "{X}:1" choice text so we can map a prompt's label back to the true payout.
const PAYOUT_BY_LABEL: Record<string, number> = {
  'Straight 7': PAYOUTS.straight,
  'Split 7/8': PAYOUTS.split,
  'Street 7–9': PAYOUTS.street,
  'Corner 7–11': PAYOUTS.corner,
  'First Five': PAYOUTS.firstFive,
  'Six line 7–12': PAYOUTS.sixline,
  'Column 1': PAYOUTS.column,
  'Red': PAYOUTS.red
}

/** Pull the bet label out of a payout prompt: "...what does a {label} bet pay?". */
function labelFromPayoutPrompt(prompt: string): string {
  const m = prompt.match(/what does a (.+) bet pay\?$/)
  expect(m, `prompt should expose the bet label: ${prompt}`).not.toBeNull()
  return m![1]!
}

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1)

describe('makeDrillQuestion — determinism', () => {
  it('same seed produces a deeply-equal question', () => {
    expect(makeDrillQuestion(123)).toEqual(makeDrillQuestion(123))
  })

  it('is stable across many seeds (no hidden global state)', () => {
    for (const seed of SEEDS) {
      expect(makeDrillQuestion(seed)).toEqual(makeDrillQuestion(seed))
    }
  })

  it('different seeds can produce different questions', () => {
    const prompts = new Set(SEEDS.map(s => makeDrillQuestion(s).prompt))
    expect(prompts.size).toBeGreaterThan(1)
  })
})

describe('makeDrillQuestion — structural invariants', () => {
  it('every question has a valid shape', () => {
    for (const seed of SEEDS) {
      const q: DrillQuestion = makeDrillQuestion(seed)
      expect(['payout', 'edge']).toContain(q.kind)
      expect(q.prompt.length).toBeGreaterThan(0)
      expect(q.explanation.length).toBeGreaterThan(0)
      expect(q.choices.length).toBeGreaterThanOrEqual(3)
      expect(q.choices.length).toBeLessThanOrEqual(4)
      // correctIndex is in range and points at a real choice
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.choices.length)
      expect(q.choices[q.correctIndex]).toBeTruthy()
      // choices are distinct
      expect(new Set(q.choices).size).toBe(q.choices.length)
    }
  })

  it('alternates kind by seed parity (even=payout, odd=edge)', () => {
    expect(makeDrillQuestion(2).kind).toBe('payout')
    expect(makeDrillQuestion(4).kind).toBe('payout')
    expect(makeDrillQuestion(1).kind).toBe('edge')
    expect(makeDrillQuestion(3).kind).toBe('edge')
  })
})

describe('makeDrillQuestion — payout questions', () => {
  it('the correct choice is the true payout for the asked bet', () => {
    const payoutSeeds = SEEDS.filter(s => makeDrillQuestion(s).kind === 'payout')
    expect(payoutSeeds.length).toBeGreaterThan(0)

    for (const seed of payoutSeeds) {
      const q = makeDrillQuestion(seed)
      const label = labelFromPayoutPrompt(q.prompt)
      const truePayout = PAYOUT_BY_LABEL[label]
      expect(truePayout, `unknown payout label "${label}"`).toBeDefined()
      expect(q.choices[q.correctIndex]).toBe(`${truePayout}:1`)
    }
  })

  it('all choices are distinct "{X}:1" payout strings', () => {
    const payoutSeeds = SEEDS.filter(s => makeDrillQuestion(s).kind === 'payout')
    for (const seed of payoutSeeds) {
      const q = makeDrillQuestion(seed)
      for (const c of q.choices) expect(c).toMatch(/^\d+:1$/)
      expect(new Set(q.choices).size).toBe(q.choices.length)
    }
  })
})

describe('makeDrillQuestion — edge questions', () => {
  it('the chosen answer always has the (equal-or-)lowest edge', () => {
    const edgeSeeds = SEEDS.filter(s => makeDrillQuestion(s).kind === 'edge')
    expect(edgeSeeds.length).toBeGreaterThan(0)

    for (const seed of edgeSeeds) {
      const q = makeDrillQuestion(seed)
      const correct = q.choices[q.correctIndex]!
      if (correct === 'They\'re identical') {
        // Form (a): two real-bet options that must be within 0.01% of each other.
        const edges = q.choices.filter(c => c !== 'They\'re identical').map(edgeForChoice)
        expect(edges.length).toBe(2)
        expect(Math.abs(edges[0]! - edges[1]!)).toBeLessThanOrEqual(0.01)
      } else {
        // Forms (b)/(c): the correct choice is strictly the cheaper wheel, and
        // "They're identical" is present only as a (wrong) decoy.
        const correctEdge = edgeForChoice(correct)
        for (const c of q.choices) {
          if (c === correct || c === 'They\'re identical') continue
          expect(correctEdge).toBeLessThan(edgeForChoice(c))
        }
      }
    }
  })

  it('every edge question carries exactly 3 choices incl. "They\'re identical"', () => {
    const edgeQs = SEEDS.map(makeDrillQuestion).filter(q => q.kind === 'edge')
    for (const q of edgeQs) {
      expect(q.choices.length).toBe(3)
      expect(q.choices).toContain('They\'re identical')
    }
  })

  it('form (a) — two bet types on the same wheel — marks "They\'re identical" correct', () => {
    // Form (a) is the only edge form that pits a straight-up against red on one
    // wheel; when present, the equal-edge answer must be the right one.
    const formA = SEEDS
      .map(makeDrillQuestion)
      .filter(q => q.kind === 'edge' && q.choices.some(c => c.startsWith('Straight 7')))
    expect(formA.length).toBeGreaterThan(0)
    for (const q of formA) {
      expect(q.choices[q.correctIndex]).toBe('They\'re identical')
    }
  })
})

/**
 * Recompute the house edge implied by an edge-question choice's text, so the
 * test verifies correctness independently of the generator's own math.
 */
function edgeForChoice(text: string): number {
  const red = (variant: 'single' | 'double', evenMoney: 'none' | 'surrender') =>
    edgePct({ type: 'red', numbers: [], stakeCents: 500 }, { variant, evenMoney })
  const straight = (variant: 'single' | 'double') =>
    edgePct({ type: 'straight', numbers: [7], stakeCents: 500 }, { variant, evenMoney: 'none' })

  if (text.startsWith('Straight 7')) return straight('single')
  if (text.includes('Surrender')) return red('double', 'surrender')
  if (text.includes('European')) return red('single', 'none')
  if (text.includes('plain American')) return red('double', 'none')
  if (text.includes('American (double-zero)')) return red('double', 'none')
  if (text.includes('single-zero')) return red('single', 'none')
  throw new Error(`cannot map edge choice to a bet: "${text}"`)
}
