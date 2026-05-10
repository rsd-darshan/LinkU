import { requireUser } from "@/lib/auth";
import { clerkImageUrlForUser } from "@/lib/clerk-user-images";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const [studentProfile, mentorProfile, posts] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: currentUser.id } }),
      prisma.mentorProfile.findUnique({ where: { userId: currentUser.id } }),
      prisma.post.findMany({
        where: { authorId: currentUser.id },
        include: {
          channel: {
            select: { id: true, slug: true, name: true, universityName: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);

    let imageUrl: string | null = null;
    try {
      imageUrl = await clerkImageUrlForUser(currentUser.clerkId);
    } catch {
      imageUrl = null;
    }

    return ok({
      user: currentUser,
      studentProfile,
      mentorProfile,
      posts,
      imageUrl
    });
  } catch (error) {
    return handleApiError(error);
  }
}
