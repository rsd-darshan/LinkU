import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { commentCreateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            studentProfile: { select: { fullName: true } },
            mentorProfile: { select: { fullName: true } }
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: 200
    });

    return ok({ comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");
    const payload = commentCreateSchema.parse(await req.json());

    if (payload.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: payload.parentId },
        select: { id: true, postId: true }
      });
      if (!parent || parent.postId !== postId) {
        return badRequest("Invalid parent comment");
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: currentUser.id,
        body: sanitizeText(payload.body),
        parentId: payload.parentId
      },
      include: {
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

    return ok({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
