import { linkuAiConfig, getBandFromCompositeScore, type FitBand } from "../config";
import { aggregateLorScores } from "./lorProcessor";

export type ProfileForScoring = {
  gpa: number | null;
  sat: number | null;
  ecasJson: unknown;
  honorsJson: unknown;
  intendedMajor: string | null;
  essayScore0_100: number | null;
  valueAlignmentScore0_100: number | null;
  lorScores: number[];
  lorRating: number | null;
};

export type UniversityStatsForScoring = {
  gpa25: number | null;
  gpa50: number | null;
  gpa75: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  majorMultiplier: number;
};

export type CompositeResult = {
  academicScore: number; // 0-100
  ecaScore: number;
  majorScore: number;
  essayScore: number;
  contextScore: number;
  composite0To100: number;
  band: FitBand;
};

export type ScoringOptions = {
  /** When provided, use this multiplier instead of stats.majorMultiplier (e.g. for major-switch simulation). */
  majorOverrideMultiplier?: number;
};

function percentileFit(value: number, p25: number, p50: number, p75: number): number {
  if (value <= p25) return 25 * (value / (p25 || 1));
  if (value <= p50) return 25 + 25 * ((value - p25) / (p50 - p25 || 1));
  if (value <= p75) return 50 + 25 * ((value - p50) / (p75 - p50 || 1));
  return 75 + 25 * Math.min(1, (value - p75) / (p75 - p50 || 1));
}

function gpaPercentileFit(gpa: number | null, stats: UniversityStatsForScoring): number {
  if (gpa == null || stats.gpa25 == null || stats.gpa50 == null || stats.gpa75 == null) return 50;
  return percentileFit(gpa, stats.gpa25, stats.gpa50, stats.gpa75);
}

function satPercentileFit(sat: number | null, stats: UniversityStatsForScoring): number {
  if (sat == null || stats.sat25 == null || stats.sat50 == null || stats.sat75 == null) return 50;
  return percentileFit(sat, stats.sat25, stats.sat50, stats.sat75);
}

/** Heuristic ECA score 0-100 from count and diversity of activities. */
function ecaScore(ecasJson: unknown, honorsJson: unknown): number {
  const ecas = Array.isArray(ecasJson) ? (ecasJson as string[]) : [];
  const honors = Array.isArray(honorsJson) ? (honorsJson as string[]) : [];
  const total = ecas.length + honors.length;
  if (total === 0) return 0;
  return Math.min(100, 20 + total * 8);
}

export function computeUniversityRelativeScore(
  profile: ProfileForScoring,
  stats: UniversityStatsForScoring,
  options?: ScoringOptions
): CompositeResult {
  const w = linkuAiConfig.weights;
  const majorMult = options?.majorOverrideMultiplier ?? stats.majorMultiplier;

  const gpaFit = gpaPercentileFit(profile.gpa, stats);
  const satFit = satPercentileFit(profile.sat, stats);
  const academicScore = (gpaFit + satFit) / 2;

  const eca = ecaScore(profile.ecasJson, profile.honorsJson);
  const majorScore = Math.min(100, 50 + majorMult * 50);
  const essayScore = profile.essayScore0_100 ?? 50;
  const valueScore = profile.valueAlignmentScore0_100 ?? 50;
  const lorAgg = aggregateLorScores(profile.lorScores);
  const lorRatingScore = profile.lorRating != null ? (profile.lorRating / 10) * 100 : 50;
  const contextScore = (valueScore + lorAgg + lorRatingScore) / 3;

  const composite0To100 =
    (w.academic / 100) * academicScore +
    (w.eca / 100) * eca +
    (w.majorAlignment / 100) * majorScore +
    (w.essay / 100) * essayScore +
    (w.contextStrategy / 100) * contextScore;

  const band = getBandFromCompositeScore(composite0To100);

  return {
    academicScore,
    ecaScore: eca,
    majorScore,
    essayScore,
    contextScore,
    composite0To100,
    band,
  };
}
