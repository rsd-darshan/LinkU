import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { clerkImageUrlByClerkId, clerkImageUrlForUser } from "@/lib/clerk-user-images";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { commentCreateSchema } from "@/lib/validation";

const commentAuthorSelect = {
  id: true,
  clerkId: true,
  role: true,
  studentProfile: { select: { fullName: true } },
  mentorProfile: { select: { fullName: true } }
} as const;

type AuthorRow = {
  id: string;
  clerkId: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  studentProfile: { fullName: string } | null;
  mentorProfile: { fullName: string } | null;
};

function publicAuthor(author: AuthorRow, imageUrl: string | null) {
  return {
    id: author.id,
    role: author.role,
    studentProfile: author.studentProfile,
    mentorProfile: author.mentorProfile,
    imageUrl
  };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params;
    if (!postId) return badRequest("postId is required");

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: commentAuthorSelect
        }
      },
      orderBy: { createdAt: "asc" },
      take: 200
    });

    let images = new Map<string, string | null>();
    try {
      images = await clerkImageUrlByClerkId(comments.map((c) => c.author.clerkId));
    } catch {
      images = new Map();
    }
    const publicComments = comments.map((c) => ({
      ...c,
      author: publicAuthor(c.author, images.get(c.author.clerkId) ?? null)
    }));

    return ok({ comments: publicComments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ postId: string }> }) {
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
          select: commentAuthorSelect
        }
      }
    });

    let imageUrl: string | null = null;
    try {
      imageUrl = await clerkImageUrlForUser(comment.author.clerkId);
    } catch {
      imageUrl = null;
    }
    const publicComment = {
      ...comment,
      author: publicAuthor(comment.author, imageUrl)
    };

    return ok({ comment: publicComment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
