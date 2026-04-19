import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { postCreateSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { ensureDemoFeedData } from "@/lib/demo-feed";
import { getCurrentDbUser } from "@/lib/auth";
import { rankFeedPostsForUser } from "@/services/feed-ranking";

export async function GET(req: NextRequest) {
  try {
    await ensureDemoFeedData();
    const slug = req.nextUrl.searchParams.get("channel") || undefined;
    const sort = req.nextUrl.searchParams.get("sort") || "for_you";
    const currentUser = await getCurrentDbUser();

    const basePosts = await prisma.post.findMany({
      where: slug ? { channel: { slug } } : {},
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
      },
      orderBy: [{ createdAt: "desc" }],
      take: 220
    });

    let posts = basePosts;
    if (sort === "top") {
      posts = [...basePosts].sort((a, b) => b.upvotes - a.upvotes || b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === "for_you" && currentUser) {
      try {
        posts = await rankFeedPostsForUser(basePosts, currentUser.id);
      } catch {
        posts = basePosts;
      }
    }

    posts = posts.slice(0, 100);
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
      posts: posts.map((post) => ({
        ...post,
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        commentCount: post._count.comments,
        hasUpvoted: upvotedPostIds.has(post.id)
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const payload = postCreateSchema.parse(await req.json());

    const created = await prisma.post.create({
      data: {
        authorId: currentUser.id,
        title: sanitizeText(payload.title),
        body: sanitizeText(payload.body),
        mediaUrls: payload.mediaUrls,
        channelId: null
      },
      include: {
        _count: { select: { comments: true } },
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

    const { _count, ...rest } = created;
    const post = {
      ...rest,
      mediaUrls: Array.isArray(rest.mediaUrls) ? rest.mediaUrls : [],
      commentCount: _count.comments,
      shareCount: rest.shareCount,
      hasUpvoted: false
    };

    return ok({ post }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
