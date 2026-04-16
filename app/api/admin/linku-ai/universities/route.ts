import { requireRole } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const list = await prisma.university.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { statistics: true, rawData: true },
        },
      },
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const { name, slug, country } = body as { name?: string; slug?: string; country?: string };
    if (!name || !slug) return badRequest("name and slug required");

    const university = await prisma.university.create({
      data: {
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase().replace(/\s+/g, "-"),
        country: country ? String(country).trim() : null,
      },
    });
    return ok(university);
  } catch (error) {
    return handleApiError(error);
  }
}
