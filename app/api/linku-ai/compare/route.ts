import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { compareRequestSchema } from "@/lib/linku-ai/schemas";
import { compareProfiles } from "@/lib/linku-ai/comparisonEngine/profileComparator";
import { computeLorScore, aggregateLorScores } from "@/lib/linku-ai/comparisonEngine/lorProcessor";
import {
  computeUniversityRelativeScore,
  type ProfileForScoring,
  type UniversityStatsForScoring,
} from "@/lib/linku-ai/comparisonEngine/universityRelativeScoring";
import { estimateMajorMultiplier } from "@/lib/linku-ai/dataPipeline/majorEstimator";
import { getCombinedSupplementText } from "@/lib/linku-ai/utils/supplementText";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const parsed = compareRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { userAId, userBId, universityId } = parsed.data;

    const [university, stats, appA, appB, profileA, profileB, lorsA, lorsB, essayAnalysisA, essayAnalysisB] =
      await Promise.all([
        prisma.university.findUnique({
          where: { id: universityId },
          include: { values: true },
        }),
        prisma.universityStatistics.findFirst({
          where: { universityId, isActive: true },
        }),
        prisma.userUniversityApplication.findUnique({
          where: { userId_universityId: { userId: userAId, universityId } },
        }),
        prisma.userUniversityApplication.findUnique({
          where: { userId_universityId: { userId: userBId, universityId } },
        }),
        prisma.userGlobalProfile.findUnique({ where: { userId: userAId } }),
        prisma.userGlobalProfile.findUnique({ where: { userId: userBId } }),
        prisma.lor.findMany({ where: { userId: userAId } }),
        prisma.lor.findMany({ where: { userId: userBId } }),
        prisma.essayAnalysis.findFirst({
          where: { userId: userAId, universityId, essayType: "SUPPLEMENT" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.essayAnalysis.findFirst({
          where: { userId: userBId, universityId, essayType: "SUPPLEMENT" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    if (!university) return notFound("University not found");

    const essayA = getCombinedSupplementText(appA) ?? profileA?.personalEssay ?? null;
    const essayB = getCombinedSupplementText(appB) ?? profileB?.personalEssay ?? null;

    const lorScoresA = lorsA.map((l) => computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating));
    const lorScoresB = lorsB.map((l) => computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating));

    const majorMultiplierA =
      profileA?.intendedMajor && stats
        ? estimateMajorMultiplier(university.slug, profileA.intendedMajor)
        : 1.0;
    const majorMultiplierB =
      profileB?.intendedMajor && stats
        ? estimateMajorMultiplier(university.slug, profileB.intendedMajor)
        : 1.0;

    const universityData = {
      name: university.name,
      slug: university.slug,
      stats: stats
        ? {
            gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
            gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
            gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
            sat25: stats.sat25,
            sat50: stats.sat50,
            sat75: stats.sat75,
            acceptanceRate: stats.acceptanceRate ? Number(stats.acceptanceRate) : null,
          }
        : null,
      values: university.values?.valuesJson,
    };

    const userAProfileJson = {
      gpa: profileA?.gpa ? Number(profileA.gpa) : null,
      sat: profileA?.sat ?? null,
      intendedMajor: profileA?.intendedMajor ?? null,
      ecas: profileA?.ecasJson,
      honors: profileA?.honorsJson,
      awards: profileA?.awardsJson,
      lorRating: profileA?.lorRating ?? null,
      lorScores: lorScoresA,
      hasSupplement: Boolean(getCombinedSupplementText(appA)),
    };

    const userBProfileJson = {
      gpa: profileB?.gpa ? Number(profileB.gpa) : null,
      sat: profileB?.sat ?? null,
      intendedMajor: profileB?.intendedMajor ?? null,
      ecas: profileB?.ecasJson,
      honors: profileB?.honorsJson,
      awards: profileB?.awardsJson,
      lorRating: profileB?.lorRating ?? null,
      lorScores: lorScoresB,
      hasSupplement: Boolean(getCombinedSupplementText(appB)),
    };

    const comparison = await compareProfiles({
      universityData: universityData as Record<string, unknown>,
      userAProfile: userAProfileJson as Record<string, unknown>,
      userASupplementOrEssay: essayA,
      userBProfile: userBProfileJson as Record<string, unknown>,
      userBSupplementOrEssay: essayB,
    });

    let scoreA: ReturnType<typeof computeUniversityRelativeScore> | null = null;
    let scoreB: ReturnType<typeof computeUniversityRelativeScore> | null = null;

    if (stats) {
      const statsForScoring: UniversityStatsForScoring = {
        gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
        gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
        gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
        sat25: stats.sat25,
        sat50: stats.sat50,
        sat75: stats.sat75,
        majorMultiplier: majorMultiplierA,
      };
      const profileAForScoring: ProfileForScoring = {
        gpa: profileA?.gpa ? Number(profileA.gpa) : null,
        sat: profileA?.sat ?? null,
        ecasJson: profileA?.ecasJson ?? [],
        honorsJson: profileA?.honorsJson ?? [],
        intendedMajor: profileA?.intendedMajor ?? null,
        essayScore0_100: essayAnalysisA?.essayScore0_100 ?? null,
        valueAlignmentScore0_100: essayAnalysisA?.valueAlignmentScore0_100 ?? null,
        lorScores: lorScoresA,
        lorRating: profileA?.lorRating ?? null,
      };
      scoreA = computeUniversityRelativeScore(profileAForScoring, statsForScoring);

      const statsForScoringB: UniversityStatsForScoring = {
        ...statsForScoring,
        majorMultiplier: majorMultiplierB,
      };
      const profileBForScoring: ProfileForScoring = {
        gpa: profileB?.gpa ? Number(profileB.gpa) : null,
        sat: profileB?.sat ?? null,
        ecasJson: profileB?.ecasJson ?? [],
        honorsJson: profileB?.honorsJson ?? [],
        intendedMajor: profileB?.intendedMajor ?? null,
        essayScore0_100: essayAnalysisB?.essayScore0_100 ?? null,
        valueAlignmentScore0_100: essayAnalysisB?.valueAlignmentScore0_100 ?? null,
        lorScores: lorScoresB,
        lorRating: profileB?.lorRating ?? null,
      };
      scoreB = computeUniversityRelativeScore(profileBForScoring, statsForScoringB);
    }

    return ok({
      comparison,
      userAScore: scoreA,
      userBScore: scoreB,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
