import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { selfOutcomeSchema } from "@/lib/linku-ai/schemas";
import { computeLorScore, aggregateLorScores } from "@/lib/linku-ai/comparisonEngine/lorProcessor";
import { estimateMajorMultiplier } from "@/lib/linku-ai/dataPipeline/majorEstimator";

function percentileFit(value: number, p25: number, p50: number, p75: number): number {
  if (value <= p25) return 25 * (value / (p25 || 1));
  if (value <= p50) return 25 + 25 * ((value - p25) / (p50 - p25 || 1));
  if (value <= p75) return 50 + 25 * ((value - p50) / (p75 - p50 || 1));
  return 75 + 25 * Math.min(1, (value - p75) / (p75 - p50 || 1));
}

function ecaScore(ecasJson: unknown, honorsJson: unknown): number {
  const ecas = Array.isArray(ecasJson) ? (ecasJson as string[]) : [];
  const honors = Array.isArray(honorsJson) ? (honorsJson as string[]) : [];
  const total = ecas.length + honors.length;
  if (total === 0) return 0;
  return Math.min(100, 20 + total * 8);
}

/** Student self-report: build profile_vector from current profile and store outcome. One per (user, university) — updates if exists. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = selfOutcomeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { universityId, result } = parsed.data;

    const [university, stats, profile, lors, essayAnalysis] = await Promise.all([
      prisma.university.findUnique({ where: { id: universityId } }),
      prisma.universityStatistics.findFirst({
        where: { universityId, isActive: true },
      }),
      prisma.userGlobalProfile.findUnique({ where: { userId: user.id } }),
      prisma.lor.findMany({ where: { userId: user.id } }),
      prisma.essayAnalysis.findFirst({
        where: { userId: user.id, universityId, essayType: "SUPPLEMENT" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!university) return notFound("University not found");

    const gpa = profile?.gpa ? Number(profile.gpa) : null;
    const sat = profile?.sat ?? null;
    const lorScores = lors.map((l) =>
      computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating)
    );
    const lorAggregate0_100 = aggregateLorScores(lorScores);
    const majorMultiplier =
      profile?.intendedMajor && stats
        ? estimateMajorMultiplier(university.slug, profile.intendedMajor)
        : 1.0;

    let gpaPercentileFit = 50;
    let satPercentileFit = 50;
    if (stats?.gpa25 != null && stats.gpa50 != null && stats.gpa75 != null && gpa != null) {
      gpaPercentileFit = percentileFit(gpa, Number(stats.gpa25), Number(stats.gpa50), Number(stats.gpa75));
    }
    if (stats?.sat25 != null && stats.sat50 != null && stats.sat75 != null && sat != null) {
      satPercentileFit = percentileFit(sat, stats.sat25, stats.sat50, stats.sat75);
    }

    const eca = ecaScore(profile?.ecasJson ?? [], profile?.honorsJson ?? []);

    const profileVector = {
      gpa: gpa ?? 0,
      sat: sat ?? 0,
      gpaPercentileFit,
      satPercentileFit,
      ecaScore: eca,
      majorMultiplier,
      essayScore0_100: essayAnalysis?.essayScore0_100 ?? 50,
      valueAlignmentScore0_100: essayAnalysis?.valueAlignmentScore0_100 ?? 50,
      lorAggregate0_100,
    };

    const existing = await prisma.admissionsOutcome.findFirst({
      where: { userId: user.id, universityId },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.admissionsOutcome.update({
        where: { id: existing.id },
        data: { result, profileVector: profileVector as object },
      });
      return ok({ id: existing.id, updated: true, result });
    }

    const outcome = await prisma.admissionsOutcome.create({
      data: {
        userId: user.id,
        universityId,
        result,
        profileVector: profileVector as object,
      },
    });
    return ok({ id: outcome.id, updated: false, result });
  } catch (error) {
    return handleApiError(error);
  }
}
