/**
 * Cron entry point for LinkU-AI data pipeline.
 * Call this from POST /api/linku-ai/cron/fetch (with auth/cron secret).
 * Does not approve stats; admin must approve after review.
 */
import { fetchAndStoreRaw } from "./fetchService";
import { RawDataSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { linkuAiLogger } from "../logger";

export async function runFetchCron(options?: {
  universityIds?: string[];
  year?: number;
  sourceTypes?: RawDataSourceType[];
}): Promise<{ processed: number; errors: string[] }> {
  const year = options?.year ?? new Date().getFullYear();
  const sourceTypes = options?.sourceTypes ?? ["CDS"];
  const universityIds =
    options?.universityIds ??
    (await prisma.university.findMany({ select: { id: true } })).map((u) => u.id);

  let processed = 0;
  const errors: string[] = [];

  for (const universityId of universityIds) {
    for (const sourceType of sourceTypes) {
      try {
        if (sourceType === "CDS") {
          const rawPayload = await fetchCdsForUniversity(universityId, year);
          if (rawPayload) {
            await fetchAndStoreRaw(universityId, year, "CDS", rawPayload);
            processed++;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${universityId}/${sourceType}: ${msg}`);
        linkuAiLogger.error("Cron fetch error", { universityId, sourceType, error: msg });
      }
    }
  }

  linkuAiLogger.info("Cron fetch completed", { processed, errors: errors.length });
  return { processed, errors };
}

async function fetchCdsForUniversity(
  _universityId: string,
  _year: number
): Promise<Record<string, unknown> | null> {
  return null;
}
