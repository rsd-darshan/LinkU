import { requireRole } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseCdsJson } from "@/lib/linku-ai/dataPipeline/cdsParser";
import { normalize } from "@/lib/linku-ai/dataPipeline/normalizationEngine";
import { validateStats } from "@/lib/linku-ai/dataPipeline/validationEngine";
import { estimateEdBoostFactor } from "@/lib/linku-ai/dataPipeline/edBoostEstimator";

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const { rawDataId } = body as { rawDataId?: string };
    if (!rawDataId) return badRequest("rawDataId required");

    const raw = await prisma.universityRawData.findUnique({
      where: { id: rawDataId },
      include: { university: true },
    });
    if (!raw) return notFound("Raw data not found");

    let normalized: ReturnType<typeof normalize> | null = null;
    if (raw.sourceType === "CDS") {
      const parsed = parseCdsJson(raw.rawJson);
      normalized = normalize(parsed);
    }
    if (!normalized) return badRequest("Only CDS raw data can be converted to statistics");

    const previous = await prisma.universityStatistics.findFirst({
      where: { universityId: raw.universityId, year: raw.year, isActive: true },
    });
    const previousForValidation = previous
      ? {
          gpa25: previous.gpa25 ? Number(previous.gpa25) : null,
          gpa50: previous.gpa50 ? Number(previous.gpa50) : null,
          gpa75: previous.gpa75 ? Number(previous.gpa75) : null,
          sat25: previous.sat25,
          sat50: previous.sat50,
          sat75: previous.sat75,
          acceptanceRate: previous.acceptanceRate ? Number(previous.acceptanceRate) : null,
          internationalAcceptanceRate: previous.internationalAcceptanceRate
            ? Number(previous.internationalAcceptanceRate)
            : null,
          needBlind: previous.needBlind,
          needAwareSeverity: previous.needAwareSeverity,
          edBoostFactor: previous.edBoostFactor ? Number(previous.edBoostFactor) : null,
        }
      : null;

    const validation = validateStats(normalized, previousForValidation);
    const edBoost = estimateEdBoostFactor(normalized.needBlind);

    const stats = await prisma.universityStatistics.upsert({
      where: {
        universityId_year: { universityId: raw.universityId, year: raw.year },
      },
      create: {
        universityId: raw.universityId,
        year: raw.year,
        gpa25: normalized.gpa25,
        gpa50: normalized.gpa50,
        gpa75: normalized.gpa75,
        sat25: normalized.sat25,
        sat50: normalized.sat50,
        sat75: normalized.sat75,
        acceptanceRate: normalized.acceptanceRate,
        internationalAcceptanceRate: normalized.internationalAcceptanceRate,
        needBlind: normalized.needBlind,
        needAwareSeverity: normalized.needAwareSeverity,
        edBoostFactor: edBoost,
        isActive: false,
        dataConfidenceScore: validation.confidenceScore,
      },
      update: {
        gpa25: normalized.gpa25,
        gpa50: normalized.gpa50,
        gpa75: normalized.gpa75,
        sat25: normalized.sat25,
        sat50: normalized.sat50,
        sat75: normalized.sat75,
        acceptanceRate: normalized.acceptanceRate,
        internationalAcceptanceRate: normalized.internationalAcceptanceRate,
        needBlind: normalized.needBlind,
        needAwareSeverity: normalized.needAwareSeverity,
        edBoostFactor: edBoost,
        dataConfidenceScore: validation.confidenceScore,
      },
      include: { university: { select: { id: true, name: true, slug: true } } },
    });

    return ok({ statistics: stats, validationValid: validation.valid, validationErrors: validation.errors });
  } catch (error) {
    return handleApiError(error);
  }
}
