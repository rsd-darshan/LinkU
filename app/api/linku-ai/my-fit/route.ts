import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { myFitRequestSchema } from "@/lib/linku-ai/schemas";
import { computeLorScore, aggregateLorScores } from "@/lib/linku-ai/comparisonEngine/lorProcessor";
import {
  computeUniversityRelativeScore,
  type ProfileForScoring,
  type UniversityStatsForScoring,
} from "@/lib/linku-ai/comparisonEngine/universityRelativeScoring";
import { estimateMajorMultiplier } from "@/lib/linku-ai/dataPipeline/majorEstimator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = myFitRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { universityId } = parsed.data;
    const userId = user.id;

    const [university, stats, app, profile, lors, essayAnalysis] = await Promise.all([
      prisma.university.findUnique({
        where: { id: universityId },
      }),
      prisma.universityStatistics.findFirst({
        where: { universityId, isActive: true },
      }),
      prisma.userUniversityApplication.findUnique({
        where: { userId_universityId: { userId, universityId } },
      }),
      prisma.userGlobalProfile.findUnique({ where: { userId } }),
      prisma.lor.findMany({ where: { userId } }),
      prisma.essayAnalysis.findFirst({
        where: { userId, universityId, essayType: "SUPPLEMENT" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!university) return notFound("University not found");

    const lorScores = lors.map((l) =>
      computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating)
    );
    const majorMultiplier =
      profile?.intendedMajor && stats
        ? estimateMajorMultiplier(university.slug, profile.intendedMajor)
        : 1.0;

    let score: ReturnType<typeof computeUniversityRelativeScore> | null = null;

    if (stats) {
      const statsForScoring: UniversityStatsForScoring = {
        gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
        gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
        gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
        sat25: stats.sat25,
        sat50: stats.sat50,
        sat75: stats.sat75,
        majorMultiplier,
      };
      const profileForScoring: ProfileForScoring = {
        gpa: profile?.gpa ? Number(profile.gpa) : null,
        sat: profile?.sat ?? null,
        ecasJson: profile?.ecasJson ?? [],
        honorsJson: profile?.honorsJson ?? [],
        intendedMajor: profile?.intendedMajor ?? null,
        essayScore0_100: essayAnalysis?.essayScore0_100 ?? null,
        valueAlignmentScore0_100: essayAnalysis?.valueAlignmentScore0_100 ?? null,
        lorScores,
        lorRating: profile?.lorRating ?? null,
      };
      score = computeUniversityRelativeScore(profileForScoring, statsForScoring);
    }

    const statsDisplay =
      stats ?
        {
          gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
          gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
          gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
          sat25: stats.sat25,
          sat50: stats.sat50,
          sat75: stats.sat75,
          acceptanceRate: stats.acceptanceRate ? Number(stats.acceptanceRate) : null,
        }
      : null;

    return ok({
      university: { id: university.id, name: university.name, slug: university.slug },
      score,
      stats: statsDisplay,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
