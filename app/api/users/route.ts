import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: currentUser.id }
      },
      select: {
        id: true,
        role: true,
        email: true,
        studentProfile: { select: { fullName: true } },
        mentorProfile: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return ok({
      users: users.map((user) => ({
        id: user.id,
        role: user.role,
        name:
          user.studentProfile?.fullName ||
          user.mentorProfile?.fullName ||
          user.email.split("@")[0]
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
