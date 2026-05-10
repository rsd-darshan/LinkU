import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { postId } = await context.params;
    const { connectionIds } = await req.json();

    if (!postId) return badRequest("postId is required");
    if (!Array.isArray(connectionIds) || connectionIds.length === 0) {
      return badRequest("connectionIds array is required");
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });

    if (!post) return badRequest("Post not found");

    const connections = await prisma.connection.findMany({
      where: {
        id: { in: connectionIds },
        status: "ACCEPTED",
        OR: [{ requesterId: currentUser.id }, { receiverId: currentUser.id }]
      },
      select: { id: true, requesterId: true, receiverId: true }
    });

    if (connections.length === 0) {
      return badRequest("No valid connections found");
    }

    await prisma.post.update({
      where: { id: postId },
      data: { shareCount: { increment: connections.length } }
    });

    return ok({
      shared: true,
      connectionCount: connections.length,
      message: `Post shared to ${connections.length} connection${connections.length > 1 ? "s" : ""}`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
