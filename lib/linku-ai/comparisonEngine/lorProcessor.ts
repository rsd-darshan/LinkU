/**
 * Compute a single weighted LOR score from strength, relationship, and credibility (each 1-10).
 */
const WEIGHTS = {
  strength: 0.5,
  relationship: 0.25,
  credibility: 0.25,
};

export function computeLorScore(
  strengthRating: number,
  relationshipRating: number,
  credibilityRating: number
): number {
  const s = Math.max(1, Math.min(10, strengthRating));
  const r = Math.max(1, Math.min(10, relationshipRating));
  const c = Math.max(1, Math.min(10, credibilityRating));
  return WEIGHTS.strength * s + WEIGHTS.relationship * r + WEIGHTS.credibility * c;
}

/** Average of multiple LOR scores, then scale to 0-100. */
export function aggregateLorScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / 10) * 100);
}
