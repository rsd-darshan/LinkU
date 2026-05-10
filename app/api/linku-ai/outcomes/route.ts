import { requireRole } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { admissionsOutcomeSchema } from "@/lib/linku-ai/schemas";

/**
 * Ingest admissions outcome for ML readiness.
 * Admin or system can POST; profile_vector should be normalized (GPA, SAT, scores, etc.).
 */
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const parsed = admissionsOutcomeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const outcome = await prisma.admissionsOutcome.create({
      data: {
        universityId: parsed.data.universityId,
        userId: parsed.data.userId ?? null,
        profileVector: parsed.data.profileVector as object,
        result: parsed.data.result,
      },
    });
    return ok(outcome);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId") ?? undefined;

    const list = await prisma.admissionsOutcome.findMany({
      where: universityId ? { universityId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        universityId: true,
        result: true,
        createdAt: true,
      },
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}
