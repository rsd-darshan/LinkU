import { NextRequest } from "next/server";
import { requireUser, syncClerkRoleMetadata } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { sanitizeText } from "@/lib/sanitize";
import { onboardingSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const payload = onboardingSchema.parse(await req.json());

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { role: payload.role }
    });
    await syncClerkRoleMetadata(updatedUser.clerkId, payload.role);

    if (payload.role === "STUDENT") {
      await prisma.mentorProfile.deleteMany({ where: { userId: currentUser.id } });
      if (!payload.intendedMajor) {
        return badRequest("intendedMajor is required for students");
      }

      await prisma.studentProfile.upsert({
        where: { userId: currentUser.id },
        create: {
          userId: currentUser.id,
          fullName: sanitizeText(payload.fullName),
          country: sanitizeText(payload.country),
          gpa: payload.gpa ?? 4.0,
          satScore: payload.satScore,
          actScore: payload.actScore,
          intendedMajor: sanitizeText(payload.intendedMajor),
          targetUniversities: payload.targetUniversities.map(sanitizeText),
          bio: payload.bio ? sanitizeText(payload.bio) : null,
          achievements: payload.achievements.map(sanitizeText),
          isVisible: payload.isVisible
        },
        update: {
          fullName: sanitizeText(payload.fullName),
          country: sanitizeText(payload.country),
          gpa: payload.gpa,
          satScore: payload.satScore ?? null,
          actScore: payload.actScore ?? null,
          intendedMajor: sanitizeText(payload.intendedMajor),
          targetUniversities: payload.targetUniversities.map(sanitizeText),
          bio: payload.bio ? sanitizeText(payload.bio) : null,
          achievements: payload.achievements.map(sanitizeText),
          isVisible: payload.isVisible
        }
      });
    }

    if (payload.role === "MENTOR") {
      await prisma.studentProfile.deleteMany({ where: { userId: currentUser.id } });
      if (!payload.university || !payload.major || !payload.graduationYear || !payload.hourlyRateCents) {
        return badRequest("university, major, graduationYear and hourlyRateCents are required for mentors");
      }

      const isEduEmail = updatedUser.email.toLowerCase().endsWith(".edu");
      await prisma.mentorProfile.upsert({
        where: { userId: currentUser.id },
        create: {
          userId: currentUser.id,
          fullName: sanitizeText(payload.fullName),
          country: sanitizeText(payload.country),
          university: sanitizeText(payload.university),
          major: sanitizeText(payload.major),
          graduationYear: payload.graduationYear,
          acceptedUniversities: payload.acceptedUniversities.map(sanitizeText),
          scholarships: payload.scholarships.map(sanitizeText),
          hourlyRateCents: payload.hourlyRateCents,
          availableTimeSlots: payload.availableTimeSlots,
          verificationStatus: isEduEmail ? "APPROVED" : "PENDING",
          verificationBadge: isEduEmail,
          bio: payload.bio ? sanitizeText(payload.bio) : null
        },
        update: {
          fullName: sanitizeText(payload.fullName),
          country: sanitizeText(payload.country),
          university: sanitizeText(payload.university),
          major: sanitizeText(payload.major),
          graduationYear: payload.graduationYear,
          acceptedUniversities: payload.acceptedUniversities.map(sanitizeText),
          scholarships: payload.scholarships.map(sanitizeText),
          hourlyRateCents: payload.hourlyRateCents,
          availableTimeSlots: payload.availableTimeSlots,
          bio: payload.bio ? sanitizeText(payload.bio) : null
        }
      });
    }

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
