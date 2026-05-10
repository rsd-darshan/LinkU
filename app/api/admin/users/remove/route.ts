import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const { userId } = (await req.json()) as { userId?: string };
    if (!userId) return badRequest("userId is required");

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
