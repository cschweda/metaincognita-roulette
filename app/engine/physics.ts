import { type Variant, type Pocket, WHEEL_ORDER, pocketCount } from './wheel'
import { type Rng, frac } from './prng'

// Optional wheel imperfection — drives the Lab's bias lessons (spec §8). A perfect
// wheel uses {} and the §2.4 χ² proof shows it is uniform.
export interface WheelCondition {
  biasStrength?: number // P(this spin is captured by the favored arc), 0..1
  biasCenter?: number // favored arc start index (rotor frame)
  biasWidth?: number // favored arc width in pockets
}

export interface Spin { index: number, pocket: Pocket }

// Reduced-order forward model: the ball travels many revolutions (>=4) opposite the
// rotor, leaves the track near a diamond, and is captured at a rotor-relative angle.
// Because total ball travel and rotor travel each span many turns, the drop angle and
// the rotor angle at capture are independent and ~uniform, so the relative angle — and
// thus the pocket — is ~uniform. Verified by the chi-square proof in sim.test.ts.
export function simulateSpin(rng: Rng, variant: Variant, cond: WheelCondition = {}): Spin {
  const N = pocketCount(variant)
  const ballRevs = 7 + rng() * 6 // ~7-13 revolutions (>=4 regulatory floor)
  const rotorRevs = 3 + rng() * 5
  // Lab-frame fraction (turns) where the ball leaves the track, pulled toward one of 8 diamonds.
  let dropTurn = frac(ballRevs + rng() * 0.13)
  const diamond = Math.round(dropTurn * 8) / 8
  dropTurn = frac(diamond + (dropTurn - diamond) * 0.55 + (rng() - 0.5) * 0.05)
  const rotorTurn = frac(rotorRevs + rng() * 0.07)
  const scatter = (rng() - 0.5) * (2.5 / N) // +/-~1 pocket of fret scatter
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
