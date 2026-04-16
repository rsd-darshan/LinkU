import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.postUpvote.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUser.id
          }
        }
      });

      if (existing) {
        // Remove upvote (toggle off)
        await tx.postUpvote.delete({
          where: {
            postId_userId: {
              postId,
              userId: currentUser.id
            }
          }
        });

        return tx.post.update({
          where: { id: postId },
          data: { upvotes: { decrement: 1 } },
          select: { id: true, upvotes: true }
        });
      }

      // Add upvote (toggle on)
      await tx.postUpvote.create({
        data: {
          postId,
          userId: currentUser.id
        }
      });

      return tx.post.update({
        where: { id: postId },
        data: { upvotes: { increment: 1 } },
        select: { id: true, upvotes: true }
      });
    });

    if (!updated) return badRequest("Post not found");
    
    // Check if user still has upvote after the transaction
    const hasUpvoted = await prisma.postUpvote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUser.id
        }
      },
      select: { id: true }
    });

    return ok({ post: { ...updated, hasUpvoted: Boolean(hasUpvoted) } });
  } catch (error) {
    return handleApiError(error);
  }
}
