/**
 * ~99.9% upper critical value for a chi-square with df degrees of freedom.
 * Wilson–Hilferty: χ²_p(df) ≈ df·(1 − 2/(9df) + z_p·√(2/(9df)))³ with
 * z₀.₉₉₉ = 3.0902 — within ±0.1 of the table for the wheel dfs (36 → 68.08
 * vs 67.985; 37 → 69.43 vs 69.346), matching the engine's fairness gates.
 */
export function chiCritical(df: number): number {
  const c = 2 / (9 * df)
  return df * Math.pow(1 - c + 3.0902 * Math.sqrt(c), 3)
}

export function isUniform(chi: number, df: number): boolean {
  return chi < chiCritical(df)
}
