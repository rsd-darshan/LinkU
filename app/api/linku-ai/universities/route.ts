import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const take = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const list = await prisma.university.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: { id: true, name: true, slug: true, country: true, state: true },
      take: take * 2,
      orderBy: { name: "asc" },
    });
    const seen = new Set<string>();
    const deduped = list.filter((u) => {
      const key = u.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return ok(deduped.slice(0, take));
  } catch (error) {
    return handleApiError(error);
  }
}
