import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { computeLorScore } from "@/lib/linku-ai/comparisonEngine/lorProcessor";
import {
  computeUniversityRelativeScore,
  type ProfileForScoring,
  type UniversityStatsForScoring,
} from "@/lib/linku-ai/comparisonEngine/universityRelativeScoring";
import { getMajorMultiplierForUniversity } from "@/lib/linku-ai/dataPipeline/majorMultiplierResolver";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const universityId =
      typeof body?.university_id === "string" ? body.university_id.trim() : null;
    const simulatedMajor =
      typeof body?.simulated_major === "string" ? body.simulated_major.trim() : null;
    if (!universityId) return badRequest("university_id is required");
    if (!simulatedMajor) return badRequest("simulated_major is required");

    const [university, stats, profile, lors, essayAnalysis] = await Promise.all([
      prisma.university.findUnique({ where: { id: universityId } }),
      prisma.universityStatistics.findFirst({ where: { universityId, isActive: true } }),
      prisma.userGlobalProfile.findUnique({ where: { userId: user.id } }),
      prisma.lor.findMany({ where: { userId: user.id } }),
      prisma.essayAnalysis.findFirst({
        where: { userId: user.id, universityId, essayType: "SUPPLEMENT" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!university) return notFound("University not found");
    if (!stats) return notFound("No active statistics for this university");

    const lorScores = lors.map((l) =>
      computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating)
    );
    const currentMajor = profile?.intendedMajor?.trim() ?? null;
    const currentMult =
      currentMajor && university
        ? await getMajorMultiplierForUniversity(universityId, university.slug, currentMajor)
        : 1.0;
    const overrideMult = await getMajorMultiplierForUniversity(
      universityId,
      university.slug,
      simulatedMajor
    );

    const statsForScoring: UniversityStatsForScoring = {
      gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
      gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
      gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
      sat25: stats.sat25,
      sat50: stats.sat50,
      sat75: stats.sat75,
      majorMultiplier: currentMult,
    };
    const profileForScoring: ProfileForScoring = {
      gpa: profile?.gpa ? Number(profile.gpa) : null,
      sat: profile?.sat ?? null,
      ecasJson: profile?.ecasJson ?? [],
      honorsJson: profile?.honorsJson ?? [],
      intendedMajor: currentMajor,
      essayScore0_100: essayAnalysis?.essayScore0_100 ?? null,
      valueAlignmentScore0_100: essayAnalysis?.valueAlignmentScore0_100 ?? null,
      lorScores,
      lorRating: profile?.lorRating ?? null,
    };

    const currentResult = computeUniversityRelativeScore(profileForScoring, statsForScoring);
    const simulatedResult = computeUniversityRelativeScore(profileForScoring, statsForScoring, {
      majorOverrideMultiplier: overrideMult,
    });

    const currentLabel = currentMajor || "your current major";
    const direction =
      simulatedResult.composite0To100 > currentResult.composite0To100
        ? "improving"
        : simulatedResult.composite0To100 < currentResult.composite0To100
          ? "reducing"
          : "keeping";
    const impact_message =
      currentMajor && currentMajor !== simulatedMajor
        ? `Switching from ${currentMajor} to ${simulatedMajor} changes competitiveness multiplier from ${currentMult.toFixed(1)} to ${overrideMult.toFixed(1)}, ${direction} your band to ${simulatedResult.band}.`
        : `Simulating ${simulatedMajor} (multiplier ${overrideMult.toFixed(1)}) gives band ${simulatedResult.band}.`;

    return ok({
      new_band: simulatedResult.band,
      new_score: simulatedResult.composite0To100,
      impact_message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
