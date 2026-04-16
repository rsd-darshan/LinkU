import { prisma } from "@/lib/prisma";

export type FeedRankCandidate = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  upvotes: number;
  shareCount: number;
  authorId: string;
  channelId: string | null;
  _count: { comments: number };
};

type UserContext = {
  joinedChannelIds: Set<string>;
  engagedChannelIds: Set<string>;
  connectedUserIds: Set<string>;
  interestTerms: Set<string>;
};

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => token.length >= 3);
}

function scorePost(post: FeedRankCandidate, context: UserContext) {
  const hoursSinceCreated = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60));
  const recencyScore = Math.max(0, 72 - hoursSinceCreated) / 72 * 12;
  const engagementScore = post.upvotes * 2.8 + post.shareCount * 2 + post._count.comments * 1.8;
  const joinedBoost = post.channelId && context.joinedChannelIds.has(post.channelId) ? 10 : 0;
  const engagedBoost = post.channelId && context.engagedChannelIds.has(post.channelId) ? 7 : 0;
  const socialBoost = context.connectedUserIds.has(post.authorId) ? 8 : 0;

  const postTerms = new Set(tokenize(`${post.title} ${post.body}`));
  let topicMatches = 0;
  for (const term of postTerms) {
    if (context.interestTerms.has(term)) topicMatches += 1;
  }
  const topicBoost = Math.min(10, topicMatches * 1.6);

  return recencyScore + engagementScore + joinedBoost + engagedBoost + socialBoost + topicBoost;
}

async function buildUserContext(userId: string): Promise<UserContext> {
  const [joinedMemberships, acceptedConnections, myPosts, myComments, profile] = await Promise.all([
    prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true }
    }),
    prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }]
      },
      select: { requesterId: true, receiverId: true }
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      select: { channelId: true, title: true, body: true },
      take: 80
    }),
    prisma.comment.findMany({
      where: { authorId: userId },
      select: { body: true, post: { select: { channelId: true, title: true, body: true } } },
      take: 120
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        studentProfile: {
          select: {
            intendedMajor: true,
            country: true,
            targetUniversities: true,
            achievements: true,
            bio: true
          }
        },
        mentorProfile: {
          select: {
            major: true,
            country: true,
            university: true,
            acceptedUniversities: true,
            scholarships: true,
            bio: true
          }
        }
      }
    })
  ]);

  const joinedChannelIds = new Set(joinedMemberships.map((entry) => entry.channelId));
  const engagedChannelIds = new Set<string>();
  const connectedUserIds = new Set<string>();
  const interestTerms = new Set<string>();

  for (const connection of acceptedConnections) {
    const otherUserId = connection.requesterId === userId ? connection.receiverId : connection.requesterId;
    connectedUserIds.add(otherUserId);
  }

  for (const post of myPosts) {
    if (post.channelId) engagedChannelIds.add(post.channelId);
    tokenize(`${post.title} ${post.body}`).forEach((term) => interestTerms.add(term));
  }

  for (const comment of myComments) {
    tokenize(comment.body).forEach((term) => interestTerms.add(term));
    if (comment.post.channelId) engagedChannelIds.add(comment.post.channelId);
    tokenize(`${comment.post.title} ${comment.post.body}`).forEach((term) => interestTerms.add(term));
  }

  if (profile?.studentProfile) {
    const sp = profile.studentProfile;
    const blob = [
      sp.intendedMajor,
      sp.country,
      sp.bio || "",
      ...(Array.isArray(sp.targetUniversities) ? sp.targetUniversities : []),
      ...(Array.isArray(sp.achievements) ? sp.achievements : [])
    ].join(" ");
    tokenize(blob).forEach((term) => interestTerms.add(term));
  }

  if (profile?.mentorProfile) {
    const mp = profile.mentorProfile;
    const blob = [
      mp.major,
      mp.country,
      mp.university,
      mp.bio || "",
      ...(Array.isArray(mp.acceptedUniversities) ? mp.acceptedUniversities : []),
      ...(Array.isArray(mp.scholarships) ? mp.scholarships : [])
    ].join(" ");
    tokenize(blob).forEach((term) => interestTerms.add(term));
  }

  return { joinedChannelIds, engagedChannelIds, connectedUserIds, interestTerms };
}

export async function rankFeedPostsForUser<T extends FeedRankCandidate>(posts: T[], userId: string): Promise<T[]> {
  const context = await buildUserContext(userId);
  return [...posts]
    .map((post) => ({ post, score: scorePost(post, context) }))
    .sort((a, b) => b.score - a.score || b.post.createdAt.getTime() - a.post.createdAt.getTime())
    .map((entry) => entry.post);
}
