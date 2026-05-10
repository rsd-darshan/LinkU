import type { RawParsedRecord } from "./normalizationEngine";

/**
 * Parse Common Data Set (CDS) structure.
 * Input can be a JSON object from CDS API or extracted from PDF.
 * Adapt keys to your actual CDS source format.
 */
export function parseCdsJson(raw: unknown): RawParsedRecord {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/%/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  return {
    gpa25: num(o.gpa25 ?? o.GPA_25 ?? o.gpa_25),
    gpa50: num(o.gpa50 ?? o.GPA_50 ?? o.gpa_50),
    gpa75: num(o.gpa75 ?? o.GPA_75 ?? o.gpa_75),
    sat25: num(o.sat25 ?? o.SAT_25 ?? o.sat_25) ?? null,
    sat50: num(o.sat50 ?? o.SAT_50 ?? o.sat_50) ?? null,
    sat75: num(o.sat75 ?? o.SAT_75 ?? o.sat_75) ?? null,
    acceptanceRate: num(o.acceptanceRate ?? o.acceptance_rate ?? o.acceptance),
    internationalAcceptanceRate: num(
      o.internationalAcceptanceRate ?? o.international_acceptance ?? o.intl_acceptance
    ),
    needBlind: o.needBlind === true || o.need_blind === true,
    needAwareSeverity:
      typeof o.needAwareSeverity === "number"
        ? o.needAwareSeverity
        : typeof o.need_aware_severity === "number"
          ? o.need_aware_severity
          : null,
    edBoostFactor: num(o.edBoostFactor ?? o.ed_boost ?? o.ed_boost_factor),
  };
}
