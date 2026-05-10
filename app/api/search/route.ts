import { NextRequest } from "next/server";
import { getCurrentDbUser, requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) {
      return ok({ people: [], posts: [], channels: [] });
    }

    const term = q.toLowerCase();

    // People: students and mentors (by fullName or email)
    const people = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { email: { contains: term, mode: "insensitive" } },
          { studentProfile: { fullName: { contains: term, mode: "insensitive" } } },
          { mentorProfile: { fullName: { contains: term, mode: "insensitive" } } }
        ]
      },
      select: {
        id: true,
        role: true,
        email: true,
        studentProfile: { select: { fullName: true } },
        mentorProfile: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const peopleList = people.map((u) => ({
      id: u.id,
      role: u.role,
      name:
        u.studentProfile?.fullName ||
        u.mentorProfile?.fullName ||
        (u.email ? u.email.split("@")[0] : "User")
    }));

    // Channels: name, slug, description, universityName
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
          { universityName: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } }
        ]
      },
      include: {
        _count: { select: { posts: true, members: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 15
    });

    // Posts: title, body, channel name/slug, author name
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { body: { contains: term, mode: "insensitive" } },
          { channel: { name: { contains: term, mode: "insensitive" } } },
          { channel: { slug: { contains: term, mode: "insensitive" } } },
          { author: { studentProfile: { fullName: { contains: term, mode: "insensitive" } } } },
          { author: { mentorProfile: { fullName: { contains: term, mode: "insensitive" } } } },
          { author: { email: { contains: term, mode: "insensitive" } } }
        ]
      },
      include: {
        _count: { select: { comments: true } },
        channel: { select: { id: true, slug: true, name: true, universityName: true } },
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
      take: 25
    });

    const upvotedPostIds = new Set<string>();
    const currentUser = await getCurrentDbUser();
    if (currentUser && posts.length > 0) {
      const upvotes = await prisma.postUpvote.findMany({
        where: {
          userId: currentUser.id,
          postId: { in: posts.map((p) => p.id) }
        },
        select: { postId: true }
      });
      upvotes.forEach((v) => upvotedPostIds.add(v.postId));
    }

    const postsList = posts.map((post) => ({
      ...post,
      mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
      commentCount: post._count.comments,
      hasUpvoted: upvotedPostIds.has(post.id)
    }));

    return ok({
      people: peopleList,
      posts: postsList,
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        universityName: c.universityName,
        description: c.description,
        _count: c._count
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
