import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { applicationSchema, type ApplicationInput } from "@/lib/linku-ai/schemas";

export async function GET() {
  try {
    const user = await requireUser();
    const list = await prisma.userUniversityApplication.findMany({
      where: { userId: user.id },
      include: {
        university: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as ApplicationInput;

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const data = parsed.data;

    const university = await prisma.university.findUnique({
      where: { id: data.universityId },
    });
    if (!university) return notFound("University not found");

    const application = await prisma.userUniversityApplication.upsert({
      where: {
        userId_universityId: { userId: user.id, universityId: data.universityId },
      },
      create: {
        userId: user.id,
        universityId: data.universityId,
        round: data.round,
        financialAidRequest: data.financialAidRequest ?? null,
        supplementEssay: data.supplementEssay ?? null,
        universitySpecificQuestions:
          data.universitySpecificQuestions == null ? Prisma.JsonNull : (data.universitySpecificQuestions as object),
        portfolioLinks: data.portfolioLinks ?? [],
        status: data.status ?? "DRAFT",
      },
      update: {
        round: data.round,
        financialAidRequest: data.financialAidRequest ?? undefined,
        supplementEssay: data.supplementEssay ?? undefined,
        universitySpecificQuestions:
          data.universitySpecificQuestions == null ? Prisma.JsonNull : (data.universitySpecificQuestions as object),
        portfolioLinks: data.portfolioLinks ?? undefined,
        status: data.status ?? undefined,
      },
      include: {
        university: { select: { id: true, name: true, slug: true } },
      },
    });

    return ok(application);
  } catch (error) {
    return handleApiError(error);
  }
}
