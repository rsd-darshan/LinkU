import { requireRole } from "@/lib/auth";
import { handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ mentorUserId: string }> }
) {
  try {
    await requireRole(["STUDENT"]);
    const { mentorUserId } = await context.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      select: {
        userId: true,
        fullName: true,
        university: true,
        major: true,
        hourlyRateCents: true,
        averageRating: true,
        acceptedUniversities: true,
        scholarships: true,
        availableTimeSlots: true,
        verificationBadge: true,
        verificationStatus: true
      }
    });

    if (!mentor || mentor.verificationStatus !== "APPROVED") {
      return notFound("Mentor not found");
    }

    const now = new Date();
    const bookedSlots = await prisma.booking.findMany({
      where: {
        mentorId: mentorUserId,
        status: "UPCOMING",
        startTime: { gte: now }
      },
      select: { startTime: true }
    });
    const bookedKeySet = new Set(bookedSlots.map((slot) => slot.startTime.toISOString()));

    const openSlots = mentor.availableTimeSlots
      .filter((slot) => slot >= now && !bookedKeySet.has(slot.toISOString()))
      .sort((a, b) => a.getTime() - b.getTime());

    return ok({
      mentor: {
        ...mentor,
        availableTimeSlots: openSlots
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
