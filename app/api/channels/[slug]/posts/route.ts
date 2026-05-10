import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCurrentDbUser } from "@/lib/auth";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { channelPostCreateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const currentUser = await getCurrentDbUser();

    const channel = await prisma.channel.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, universityName: true, description: true }
    });
    if (!channel) return notFound("Channel not found");

    const posts = await prisma.post.findMany({
      where: { channelId: channel.id },
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
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const upvotedPostIds = new Set<string>();
    if (currentUser && posts.length > 0) {
      const upvotes = await prisma.postUpvote.findMany({
        where: {
          userId: currentUser.id,
          postId: { in: posts.map((post) => post.id) }
        },
        select: { postId: true }
      });
      for (const upvote of upvotes) {
        upvotedPostIds.add(upvote.postId);
      }
    }

    return ok({
      channel,
      posts: posts.map((post) => ({
        ...post,
        hasUpvoted: upvotedPostIds.has(post.id)
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { slug } = await context.params;
    const payload = channelPostCreateSchema.parse(await req.json());
    if (payload.channelSlug !== slug) return badRequest("Channel mismatch");

    const channel = await prisma.channel.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!channel) return notFound("Channel not found");

    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: channel.id,
          userId: currentUser.id
        }
      },
      create: {
        channelId: channel.id,
        userId: currentUser.id
      },
      update: {}
    });

    const post = await prisma.post.create({
      data: {
        channelId: channel.id,
        authorId: currentUser.id,
        title: sanitizeText(payload.title),
        body: sanitizeText(payload.body),
        mediaUrls: payload.mediaUrls
      }
    });

    return ok({ post }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
