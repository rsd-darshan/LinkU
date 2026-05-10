import { prisma } from "@/lib/prisma";
import { estimateMajorMultiplier } from "./majorEstimator";

/**
 * Resolve major competitiveness multiplier for a university.
 * Uses UniversityMajorMultiplier table if an entry exists; otherwise falls back to estimateMajorMultiplier.
 */
export async function getMajorMultiplierForUniversity(
  universityId: string,
  universitySlug: string,
  majorName: string
): Promise<number> {
  if (!majorName?.trim()) return 1.0;
  const fromDb = await prisma.universityMajorMultiplier.findUnique({
    where: {
      universityId_majorName: { universityId, majorName: majorName.trim() },
    },
  });
  if (fromDb) return Number(fromDb.multiplier);
  return estimateMajorMultiplier(universitySlug, majorName);
}
