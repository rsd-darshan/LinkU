import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { lorSchema, type LorInput } from "@/lib/linku-ai/schemas";

export async function GET() {
  try {
    const user = await requireUser();
    const list = await prisma.lor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return ok(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as LorInput;

    const parsed = lorSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const lor = await prisma.lor.create({
      data: {
        userId: user.id,
        teacherName: parsed.data.teacherName,
        strengthRating: parsed.data.strengthRating,
        relationshipRating: parsed.data.relationshipRating,
        credibilityRating: parsed.data.credibilityRating,
      },
    });
    return ok(lor);
  } catch (error) {
    return handleApiError(error);
  }
}
