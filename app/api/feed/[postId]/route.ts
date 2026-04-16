import { NextRequest } from "next/server";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");

    const currentUser = await getCurrentDbUser();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: { comments: true }
        },
        channel: {
          select: { id: true, slug: true, name: true, universityName: true }
        },
        author: {
          select: {
            id: true,
            role: true,
            studentProfile: { select: { fullName: true } },
            mentorProfile: { select: { fullName: true } }
          }
        }
      }
    });

    if (!post) return notFound("Post not found");

    let hasUpvoted = false;
    if (currentUser) {
      const upvote = await prisma.postUpvote.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUser.id
          }
        },
        select: { id: true }
      });
      hasUpvoted = Boolean(upvote);
    }

    return ok({
      post: {
        ...post,
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        commentCount: post._count.comments,
        hasUpvoted
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
