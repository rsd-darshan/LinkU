import { requireRole } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");
    if (!universityId) return badRequest("universityId required");

    const history = await prisma.universityStatisticsHistory.findMany({
      where: { universityId },
      orderBy: [{ year: "asc" }, { effectiveAt: "asc" }],
      take: 50,
    });

    const active = await prisma.universityStatistics.findMany({
      where: { universityId, isActive: true },
      orderBy: { year: "asc" },
    });

    return ok({
      history: history.map((h) => ({
        year: h.year,
        effectiveAt: h.effectiveAt,
        gpa50: h.gpa50 ? Number(h.gpa50) : null,
        sat50: h.sat50,
        acceptanceRate: h.acceptanceRate ? Number(h.acceptanceRate) : null,
      })),
      active: active.map((a) => ({
        year: a.year,
        gpa50: a.gpa50 ? Number(a.gpa50) : null,
        sat50: a.sat50,
        acceptanceRate: a.acceptanceRate ? Number(a.acceptanceRate) : null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
