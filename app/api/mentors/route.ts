import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["STUDENT"]);
    const q = req.nextUrl.searchParams.get("q") || "";

    const mentors = await prisma.mentorProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { university: { contains: q, mode: "insensitive" } },
                { major: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      select: {
        userId: true,
        fullName: true,
        university: true,
        major: true,
        hourlyRateCents: true,
        averageRating: true,
        verificationBadge: true
      },
      orderBy: [{ verificationBadge: "desc" }, { averageRating: "desc" }],
      take: 50
    });

    return ok({ mentors });
  } catch (error) {
    return handleApiError(error);
  }
}
