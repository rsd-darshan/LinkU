import { NextRequest } from "next/server";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    if (!userId) return badRequest("userId is required");

    const currentUser = await getCurrentDbUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: true,
        mentorProfile: true,
        _count: {
          select: {
            posts: true,
            sentConnectionRequests: true,
            receivedConnectionRequests: true
          }
        }
      }
    });

    if (!user) return notFound("User not found");

    let connectionStatus: "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "SELF" = "NONE";
    if (currentUser) {
      if (currentUser.id === userId) {
        connectionStatus = "SELF";
      } else {
        const connection = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: currentUser.id, receiverId: userId },
              { requesterId: userId, receiverId: currentUser.id }
            ]
          },
          select: { status: true }
        });
        if (connection) {
          connectionStatus = connection.status;
        }
      }
    }

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        channel: {
          select: { id: true, slug: true, name: true, universityName: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return ok({
      user: {
        ...user,
        connectionStatus,
        posts: posts.map((post) => ({
          ...post,
          mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
          commentCount: post._count.comments
        }))
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
