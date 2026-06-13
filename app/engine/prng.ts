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
