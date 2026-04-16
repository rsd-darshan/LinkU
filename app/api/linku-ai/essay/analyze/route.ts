import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { essayAnalyzeSchema } from "@/lib/linku-ai/schemas";
import { analyzeEssay, getUniversityValues } from "@/lib/linku-ai/comparisonEngine/supplementAnalyzer";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = essayAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { essayType, content, universityId } = parsed.data;
    if (essayType === "SUPPLEMENT" && !universityId) {
      return badRequest("universityId required for supplement essay");
    }

    const contentHash = createHash("sha256").update(content).digest("hex").slice(0, 16);
    const universityValues = universityId ? await getUniversityValues(universityId) : undefined;
    const scores = await analyzeEssay(content, universityValues);

    const analysis = await prisma.essayAnalysis.create({
      data: {
        userId: user.id,
        universityId: universityId ?? null,
        essayType,
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

    return ok({
      id: analysis.id,
      essayScore0_100: scores.essayScore0_100,
      valueAlignmentScore0_100: scores.valueAlignmentScore0_100,
      coherence: scores.coherence,
      narrativeDepth: scores.narrativeDepth,
      originality: scores.originality,
      alignment: scores.alignment,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
