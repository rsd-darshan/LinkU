import type { NormalizedStats } from "./validationEngine";

export type RawParsedRecord = {
  gpa25?: number | null;
  gpa50?: number | null;
  gpa75?: number | null;
  sat25?: number | null;
  sat50?: number | null;
  sat75?: number | null;
  acceptanceRate?: number | null;
  internationalAcceptanceRate?: number | null;
  needBlind?: boolean;
  needAwareSeverity?: number | null;
  edBoostFactor?: number | null;
};

export function normalize(raw: RawParsedRecord): NormalizedStats {
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const int = (v: unknown): number | null => {
    const n = num(v);
    return n != null ? Math.round(n) : null;
  };
  const clamp = (v: number | null, min: number, max: number): number | null =>
    v == null ? null : Math.max(min, Math.min(max, v));

  return {
    gpa25: clamp(num(raw.gpa25), 0, 4.5),
    gpa50: clamp(num(raw.gpa50), 0, 4.5),
    gpa75: clamp(num(raw.gpa75), 0, 4.5),
    sat25: raw.sat25 != null ? int(raw.sat25) : null,
    sat50: raw.sat50 != null ? int(raw.sat50) : null,
    sat75: raw.sat75 != null ? int(raw.sat75) : null,
    acceptanceRate: raw.acceptanceRate != null ? num(raw.acceptanceRate) : null,
    internationalAcceptanceRate:
      raw.internationalAcceptanceRate != null ? num(raw.internationalAcceptanceRate) : null,
    needBlind: Boolean(raw.needBlind),
    needAwareSeverity:
      raw.needAwareSeverity != null && raw.needAwareSeverity >= 1 && raw.needAwareSeverity <= 3
        ? raw.needAwareSeverity
        : null,
    edBoostFactor: raw.edBoostFactor != null ? num(raw.edBoostFactor) : null,
  };
}
