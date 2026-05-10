import { requireRole } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId") ?? undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    const list = await prisma.universityRawData.findMany({
      where: {
        ...(universityId && { universityId }),
        ...(year != null && !Number.isNaN(year) && { year }),
      },
      include: {
        university: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}
