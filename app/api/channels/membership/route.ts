import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const [joined, suggested] = await Promise.all([
      prisma.channel.findMany({
        where: {
          members: {
            some: { userId: currentUser.id }
          }
        },
        include: {
          _count: { select: { posts: true, members: true } }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.channel.findMany({
        where: {
          members: {
            none: { userId: currentUser.id }
          }
        },
        include: {
          _count: { select: { posts: true, members: true } }
        },
        orderBy: [{ createdAt: "desc" }],
        take: 12
      })
    ]);

    return ok({ joined, suggested });
  } catch (error) {
    return handleApiError(error);
  }
}
