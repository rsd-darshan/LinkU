import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const { mentorUserId } = (await req.json()) as { mentorUserId?: string };
    if (!mentorUserId) return badRequest("mentorUserId is required");

    const mentor = await prisma.mentorProfile.update({
      where: { userId: mentorUserId },
      data: {
        verificationStatus: "APPROVED",
        verificationBadge: true
      }
    });

    return ok({ mentor });
  } catch (error) {
    return handleApiError(error);
  }
}
