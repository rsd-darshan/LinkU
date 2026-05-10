import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { applicationSchema, type ApplicationInput } from "@/lib/linku-ai/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const application = await prisma.userUniversityApplication.findFirst({
      where: { id, userId: user.id },
      include: {
        university: true,
      },
    });
    if (!application) return notFound("Application not found");
    return ok(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as Partial<ApplicationInput>;

    const existing = await prisma.userUniversityApplication.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFound("Application not found");

    const parsed = applicationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const data = parsed.data;

    const application = await prisma.userUniversityApplication.update({
      where: { id },
      data: {
        ...(data.round != null && { round: data.round }),
        ...(data.financialAidRequest !== undefined && { financialAidRequest: data.financialAidRequest }),
        ...(data.supplementEssay !== undefined && { supplementEssay: data.supplementEssay }),
        ...(data.supplementEssaysJson !== undefined && {
          supplementEssaysJson:
            data.supplementEssaysJson === null
              ? Prisma.JsonNull
              : (data.supplementEssaysJson as object),
        }),
        ...(data.universitySpecificQuestions !== undefined && {
          universitySpecificQuestions:
            data.universitySpecificQuestions === null
              ? Prisma.JsonNull
              : (data.universitySpecificQuestions as object),
        }),
        ...(data.portfolioLinks !== undefined && { portfolioLinks: data.portfolioLinks }),
        ...(data.status != null && { status: data.status }),
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await prisma.userUniversityApplication.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFound("Application not found");

    await prisma.userUniversityApplication.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
