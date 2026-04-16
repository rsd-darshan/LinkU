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
import { analyzeEssay, getUniversityValues } from "@/lib/linku-ai/comparisonEngine/supplementAnalyzer";
import { getCombinedSupplementText } from "@/lib/linku-ai/utils/supplementText";
import { createHash } from "crypto";

/** Map EssayAnalysis fields to radar axes (0-10). */
function toSupplementBreakdown(analysis: {
  coherence: number | null;
  narrativeDepth: number | null;
  originality: number | null;
  alignment: number | null;
}) {
  const c = analysis.coherence ?? 5;
  const n = analysis.narrativeDepth ?? 5;
  const o = analysis.originality ?? 5;
  const a = analysis.alignment ?? 5;
  const authenticity = Math.round((n + o) / 2);
  return {
    valueAlignment: a,
    specificity: o,
    narrativeDepth: n,
    authenticity: Math.min(10, Math.max(0, authenticity)),
    clarity: c,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("university_id") ?? searchParams.get("universityId");
    if (!universityId) return badRequest("university_id is required");

    const [university, stats, app, profile, lors, essayAnalysis, majorMultipliers] = await Promise.all([
      prisma.university.findUnique({ where: { id: universityId } }),
      prisma.universityStatistics.findFirst({ where: { universityId, isActive: true } }),
      prisma.userUniversityApplication.findUnique({
        where: { userId_universityId: { userId: user.id, universityId } },
      }),
      prisma.userGlobalProfile.findUnique({ where: { userId: user.id } }),
      prisma.lor.findMany({ where: { userId: user.id } }),
      prisma.essayAnalysis.findFirst({
        where: { userId: user.id, universityId, essayType: "SUPPLEMENT" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.universityMajorMultiplier.findMany({
        where: { universityId },
        select: { majorName: true },
        orderBy: { majorName: "asc" },
      }),
    ]);

    if (!university) return notFound("University not found");

    let analysis = essayAnalysis;
    const supplementText = getCombinedSupplementText(app);

    if (supplementText && !analysis) {
      const universityValues = await getUniversityValues(universityId);
      const scores = await analyzeEssay(supplementText, universityValues);
      const contentHash = createHash("sha256").update(supplementText).digest("hex").slice(0, 16);
      analysis = await prisma.essayAnalysis.create({
        data: {
          userId: user.id,
          universityId,
          essayType: "SUPPLEMENT",
          contentHash,
          coherence: scores.coherence,
          narrativeDepth: scores.narrativeDepth,
          originality: scores.originality,
          alignment: scores.alignment,
          essayScore0_100: scores.essayScore0_100,
          valueAlignmentScore0_100: scores.valueAlignmentScore0_100 ?? null,
          rawResponseJson: scores as unknown as object,
        },
      });
    }

    const lorScores = lors.map((l) =>
      computeLorScore(l.strengthRating, l.relationshipRating, l.credibilityRating)
    );
    const currentMajor = profile?.intendedMajor?.trim() ?? null;
    const majorMultiplier =
      currentMajor && university && stats
        ? await getMajorMultiplierForUniversity(universityId, university.slug, currentMajor)
        : 1.0;

    let band: string | null = null;
    let compositeScore: number | null = null;

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
        intendedMajor: currentMajor,
        essayScore0_100: analysis?.essayScore0_100 ?? null,
        valueAlignmentScore0_100: analysis?.valueAlignmentScore0_100 ?? null,
        lorScores,
        lorRating: profile?.lorRating ?? null,
      };
      const result = computeUniversityRelativeScore(profileForScoring, statsForScoring);
      band = result.band;
      compositeScore = result.composite0To100;
    }

    const supplementBreakdown =
      analysis && supplementText
        ? toSupplementBreakdown({
            coherence: analysis.coherence,
            narrativeDepth: analysis.narrativeDepth,
            originality: analysis.originality,
            alignment: analysis.alignment,
          })
        : null;

    const availableMajors = majorMultipliers.map((m) => m.majorName);
    if (availableMajors.length === 0 && currentMajor) {
      availableMajors.push(currentMajor);
    }

    return ok({
      band,
      composite_score: compositeScore,
      supplement_breakdown: supplementBreakdown,
      has_supplement: Boolean(supplementText),
      available_majors: [...new Set(availableMajors)].sort(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
