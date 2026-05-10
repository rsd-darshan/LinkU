import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    await requireUser();
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");

    const post = await prisma.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
      select: { id: true, shareCount: true }
    });

    return ok({ post });
  } catch (error) {
    return handleApiError(error);
  }
}
