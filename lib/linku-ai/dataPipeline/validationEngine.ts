import { linkuAiConfig } from "../config";
import { linkuAiLogger } from "../logger";

export type NormalizedStats = {
  gpa25: number | null;
  gpa50: number | null;
  gpa75: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  acceptanceRate: number | null;
  internationalAcceptanceRate: number | null;
  needBlind: boolean;
  needAwareSeverity: number | null;
  edBoostFactor: number | null;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  confidenceScore: number; // 0-100
};

const { validation } = linkuAiConfig;

export function validateStats(
  stats: NormalizedStats,
  previousYearStats?: NormalizedStats | null
): ValidationResult {
  const errors: string[] = [];

  if (stats.gpa25 != null && (stats.gpa25 < validation.gpaMin || stats.gpa25 > validation.gpaMax)) {
    errors.push(`GPA 25th percentile must be between ${validation.gpaMin} and ${validation.gpaMax}`);
  }
  if (stats.gpa50 != null && (stats.gpa50 < validation.gpaMin || stats.gpa50 > validation.gpaMax)) {
    errors.push(`GPA 50th percentile must be between ${validation.gpaMin} and ${validation.gpaMax}`);
  }
  if (stats.gpa75 != null && (stats.gpa75 < validation.gpaMin || stats.gpa75 > validation.gpaMax)) {
    errors.push(`GPA 75th percentile must be between ${validation.gpaMin} and ${validation.gpaMax}`);
  }

  if (stats.sat25 != null && (stats.sat25 < validation.satMin || stats.sat25 > validation.satMax)) {
    errors.push(`SAT 25th must be between ${validation.satMin} and ${validation.satMax}`);
  }
  if (stats.sat50 != null && (stats.sat50 < validation.satMin || stats.sat50 > validation.satMax)) {
    errors.push(`SAT 50th must be between ${validation.satMin} and ${validation.satMax}`);
  }
  if (stats.sat75 != null && (stats.sat75 < validation.satMin || stats.sat75 > validation.satMax)) {
    errors.push(`SAT 75th must be between ${validation.satMin} and ${validation.satMax}`);
  }

  if (
    stats.acceptanceRate != null &&
    (stats.acceptanceRate < validation.acceptanceRateMin || stats.acceptanceRate > validation.acceptanceRateMax)
  ) {
    errors.push(`Acceptance rate must be between ${validation.acceptanceRateMin} and ${validation.acceptanceRateMax}%`);
  }

  if (previousYearStats && stats.acceptanceRate != null && previousYearStats.acceptanceRate != null) {
    const prev = previousYearStats.acceptanceRate;
    const curr = stats.acceptanceRate;
    const change = Math.abs(curr - prev);
    if (change > validation.yoyVariationMaxPercent) {
      errors.push(
        `Year-over-year acceptance rate change (${change.toFixed(1)}%) exceeds max ${validation.yoyVariationMaxPercent}%`
      );
    }
  }

  let confidenceScore = 80;
  if (errors.length > 0) {
    confidenceScore = Math.max(0, 80 - errors.length * 15);
    linkuAiLogger.warn("Validation flagged stats", { errors, confidenceScore });
  }

  return {
    valid: errors.length === 0,
    errors,
    confidenceScore,
  };
}
