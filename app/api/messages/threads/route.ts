import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await requireUser();

    const [acceptedConnections, bookings] = await Promise.all([
      prisma.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: currentUser.id }, { receiverId: currentUser.id }]
        },
        include: {
          requester: {
            select: {
              id: true,
              studentProfile: { select: { fullName: true } },
              mentorProfile: { select: { fullName: true } }
            }
          },
          receiver: {
            select: {
              id: true,
              studentProfile: { select: { fullName: true } },
              mentorProfile: { select: { fullName: true } }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.booking.findMany({
        where: {
          OR: [{ studentId: currentUser.id }, { mentorId: currentUser.id }],
          status: { in: ["UPCOMING", "COMPLETED"] }
        },
        include: {
          student: {
            select: {
              id: true,
              studentProfile: { select: { fullName: true } }
            }
          },
          mentor: {
            select: {
              id: true,
              mentorProfile: { select: { fullName: true } }
            }
          }
        },
        orderBy: { startTime: "desc" },
        take: 50
      })
    ]);

    return ok({ acceptedConnections, bookings });
  } catch (error) {
    return handleApiError(error);
  }
}
