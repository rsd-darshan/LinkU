import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rankMentorMatches } from "@/services/matching";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireRole(["STUDENT"]);
    const major = req.nextUrl.searchParams.get("major") || undefined;
    const country = req.nextUrl.searchParams.get("country") || undefined;
    const targetUniversity = req.nextUrl.searchParams.get("targetUniversity") || undefined;
    const minRateCents = Number(req.nextUrl.searchParams.get("minRateCents") || 0) || 0;
    const maxRateRaw = req.nextUrl.searchParams.get("maxRateCents");
    const maxRateCents = maxRateRaw ? Number(maxRateRaw) : undefined;

    const student = await prisma.studentProfile.findUnique({
      where: { userId: currentUser.id }
    });

    if (!student) return notFound("Student profile not found");

    const mentors = await prisma.mentorProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        ...(major ? { major: { contains: major, mode: "insensitive" } } : {}),
        ...(country ? { country: { contains: country, mode: "insensitive" } } : {}),
        ...(targetUniversity ? { acceptedUniversities: { has: targetUniversity } } : {}),
        ...(minRateCents ? { hourlyRateCents: { gte: minRateCents } } : {}),
        ...(maxRateCents ? { hourlyRateCents: { lte: maxRateCents } } : {})
      },
      orderBy: [{ verificationBadge: "desc" }, { averageRating: "desc" }]
    });

    const mentorAvgStudentGpa = new Map<string, number | null>();
    mentors.forEach((mentor) => {
      mentorAvgStudentGpa.set(mentor.id, null);
    });

    const ranked = rankMentorMatches(student, mentors, mentorAvgStudentGpa);
    return ok({
      recommendations: ranked.map((item) => ({
        score: item.score,
        mentor: item.mentor
      })),
      total: mentors.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
