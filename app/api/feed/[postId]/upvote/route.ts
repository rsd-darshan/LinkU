import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
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
      const rows = await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM "Post" WHERE id = ${postId} FOR UPDATE`
      );
      if (!rows[0]) return null;

      const existing = await tx.postUpvote.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUser.id
          }
        }
      });

      if (existing) {
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

    if (!updated) return notFound("Post not found");
    
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
