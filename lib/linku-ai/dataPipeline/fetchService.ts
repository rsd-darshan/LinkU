import { prisma } from "@/lib/prisma";
import { RawDataSourceType } from "@prisma/client";
import { linkuAiLogger } from "../logger";
import { parseCdsJson } from "./cdsParser";
import { fetchIpedsForUnit } from "./ipedsFetcher";
import { normalize } from "./normalizationEngine";
import { validateStats, type NormalizedStats } from "./validationEngine";

export type FetchResult = {
  universityId: string;
  year: number;
  sourceType: RawDataSourceType;
  rawDataId: string;
  normalized: NormalizedStats | null;
  validationValid: boolean;
  validationErrors: string[];
  confidenceScore: number;
};

/**
 * Fetch and store raw data for a university/year from a given source.
 * Does not approve or set is_active; admin must approve.
 */
export async function fetchAndStoreRaw(
  universityId: string,
  year: number,
  sourceType: RawDataSourceType,
  rawPayload: unknown
): Promise<FetchResult> {
  const raw = await prisma.universityRawData.create({
    data: {
      universityId,
      sourceType,
      year,
      rawJson: (rawPayload ?? {}) as object,
    },
  });

  let normalized: NormalizedStats | null = null;
  let validationValid = false;
  let validationErrors: string[] = [];
  let confidenceScore = 0;

  if (sourceType === "CDS") {
    const parsed = parseCdsJson(rawPayload);
    normalized = normalize(parsed);
    const previous = await getPreviousYearStats(universityId, year);
    const validation = validateStats(normalized, previous);
    validationValid = validation.valid;
    validationErrors = validation.errors;
    confidenceScore = validation.confidenceScore;
  } else if (sourceType === "IPEDS" || sourceType === "NCES") {
    // Map IPEDS/NCES response to RawParsedRecord then normalize
    const parsed = mapIpedsToRecord(await fetchIpedsForUnit(universityId, year));
    normalized = normalize(parsed);
    const previous = await getPreviousYearStats(universityId, year);
    const validation = validateStats(normalized, previous);
    validationValid = validation.valid;
    validationErrors = validation.errors;
    confidenceScore = validation.confidenceScore;
  }

  linkuAiLogger.info("Stored raw data", {
    universityId,
    year,
    sourceType,
    rawDataId: raw.id,
    validationValid,
  });

  return {
    universityId,
    year,
    sourceType,
    rawDataId: raw.id,
    normalized,
    validationValid,
    validationErrors,
    confidenceScore,
  };
}

async function getPreviousYearStats(
  universityId: string,
  year: number
): Promise<NormalizedStats | null> {
  const prev = await prisma.universityStatistics.findFirst({
    where: { universityId, year: year - 1, isActive: true },
  });
  if (!prev) return null;
  return {
    gpa25: prev.gpa25 ? Number(prev.gpa25) : null,
    gpa50: prev.gpa50 ? Number(prev.gpa50) : null,
    gpa75: prev.gpa75 ? Number(prev.gpa75) : null,
    sat25: prev.sat25,
    sat50: prev.sat50,
    sat75: prev.sat75,
    acceptanceRate: prev.acceptanceRate ? Number(prev.acceptanceRate) : null,
    internationalAcceptanceRate: prev.internationalAcceptanceRate
      ? Number(prev.internationalAcceptanceRate)
      : null,
    needBlind: prev.needBlind,
    needAwareSeverity: prev.needAwareSeverity,
    edBoostFactor: prev.edBoostFactor ? Number(prev.edBoostFactor) : null,
  };
}

function mapIpedsToRecord(ipeds: Record<string, unknown>): Parameters<typeof normalize>[0] {
  return {
    gpa25: ipeds.gpa25 as number | undefined,
    gpa50: ipeds.gpa50 as number | undefined,
    gpa75: ipeds.gpa75 as number | undefined,
    sat25: ipeds.sat25 as number | undefined,
    sat50: ipeds.sat50 as number | undefined,
    sat75: ipeds.sat75 as number | undefined,
    acceptanceRate: ipeds.acceptanceRate as number | undefined,
    internationalAcceptanceRate: ipeds.internationalAcceptanceRate as number | undefined,
    needBlind: ipeds.needBlind as boolean | undefined,
    needAwareSeverity: ipeds.needAwareSeverity as number | undefined,
    edBoostFactor: ipeds.edBoostFactor as number | undefined,
  };
}
