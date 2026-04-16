import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { lorSchema, type LorInput } from "@/lib/linku-ai/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as Partial<LorInput>;

    const existing = await prisma.lor.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFound("LOR not found");

    const parsed = lorSchema.partial().safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const lor = await prisma.lor.update({
      where: { id },
      data: {
        ...(parsed.data.teacherName != null && { teacherName: parsed.data.teacherName }),
        ...(parsed.data.strengthRating != null && { strengthRating: parsed.data.strengthRating }),
        ...(parsed.data.relationshipRating != null && { relationshipRating: parsed.data.relationshipRating }),
        ...(parsed.data.credibilityRating != null && { credibilityRating: parsed.data.credibilityRating }),
      },
    });
    return ok(lor);
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

    const existing = await prisma.lor.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFound("LOR not found");

    await prisma.lor.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
