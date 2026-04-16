import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const university = req.nextUrl.searchParams.get("targetUniversity") || undefined;
    const major = req.nextUrl.searchParams.get("major") || undefined;
    const country = req.nextUrl.searchParams.get("country") || undefined;

    const students = await prisma.studentProfile.findMany({
      where: {
        isVisible: true,
        ...(major ? { intendedMajor: { contains: major, mode: "insensitive" } } : {}),
        ...(country ? { country: { contains: country, mode: "insensitive" } } : {}),
        ...(university ? { targetUniversities: { has: university } } : {})
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
      take: 50
    });

    return ok({ students });
  } catch (error) {
    return handleApiError(error);
  }
}
