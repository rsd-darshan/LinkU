/**
 * Estimate ED boost factor from policy. Default 1.0; can be 1.05-1.15 for strong ED schools.
 */
export function estimateEdBoostFactor(hasEdPolicy: boolean, _historicalEdRate?: number | null): number {
  if (!hasEdPolicy) return 1.0;
  // Optional: use historical ED acceptance vs RD to derive factor
  return 1.05;
}
