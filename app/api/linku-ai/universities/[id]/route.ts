import { requireUser } from "@/lib/auth";
import { handleApiError, ok, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

    const university = await prisma.university.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, country: true, state: true },
    });
    if (!university) return notFound("University not found");
    return ok(university);
  } catch (error) {
    return handleApiError(error);
  }
}
