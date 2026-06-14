/** ~99.9% upper critical value for a chi-square with df degrees of freedom (approx). */
export function chiCritical(df: number): number {
  return df + 3.09 * Math.sqrt(2 * df)
}

export function isUniform(chi: number, df: number): boolean {
  return chi < chiCritical(df)
}
