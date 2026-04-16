import { requireRole } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId") ?? undefined;
    const pendingOnly = searchParams.get("pending") === "true";

    const list = await prisma.universityStatistics.findMany({
      where: {
        ...(universityId && { universityId }),
        ...(pendingOnly && { isActive: false, approvedAt: null }),
      },
      include: {
        university: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const body = await request.json();
    const { action, statisticsId, ...override } = body as {
      action: "approve" | "reject" | "override";
      statisticsId: string;
      [k: string]: unknown;
    };

    if (!statisticsId) return badRequest("statisticsId required");

    const existing = await prisma.universityStatistics.findUnique({
      where: { id: statisticsId },
      include: { university: true },
    });
    if (!existing) return notFound("Statistics not found");

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.universityStatistics.updateMany({
          where: { universityId: existing.universityId, year: existing.year },
          data: { isActive: false },
        });
        await tx.universityStatistics.update({
          where: { id: statisticsId },
          data: {
            isActive: true,
            approvedAt: new Date(),
            approvedById: admin.id,
          },
        });
        await tx.universityStatisticsHistory.create({
          data: {
            universityId: existing.universityId,
            year: existing.year,
            gpa25: existing.gpa25,
            gpa50: existing.gpa50,
            gpa75: existing.gpa75,
            sat25: existing.sat25,
            sat50: existing.sat50,
            sat75: existing.sat75,
            acceptanceRate: existing.acceptanceRate,
            internationalAcceptanceRate: existing.internationalAcceptanceRate,
            needBlind: existing.needBlind,
            needAwareSeverity: existing.needAwareSeverity,
            edBoostFactor: existing.edBoostFactor,
            dataConfidenceScore: existing.dataConfidenceScore,
          },
        });
      });
      const updated = await prisma.universityStatistics.findUnique({
        where: { id: statisticsId },
        include: { university: { select: { id: true, name: true, slug: true } } },
      });
      return ok(updated);
    }

    if (action === "override") {
      const data: Record<string, unknown> = {};
      if (override.gpa25 != null) data.gpa25 = override.gpa25;
      if (override.gpa50 != null) data.gpa50 = override.gpa50;
      if (override.gpa75 != null) data.gpa75 = override.gpa75;
      if (override.sat25 != null) data.sat25 = override.sat25;
      if (override.sat50 != null) data.sat50 = override.sat50;
      if (override.sat75 != null) data.sat75 = override.sat75;
      if (override.acceptanceRate != null) data.acceptanceRate = override.acceptanceRate;
      if (override.dataConfidenceScore != null) data.dataConfidenceScore = override.dataConfidenceScore;
      const updated = await prisma.universityStatistics.update({
        where: { id: statisticsId },
        data: data as Parameters<typeof prisma.universityStatistics.update>[0]["data"],
        include: { university: { select: { id: true, name: true, slug: true } } },
      });
      return ok(updated);
    }

    return badRequest("action must be approve, reject, or override");
  } catch (error) {
    return handleApiError(error);
  }
}
