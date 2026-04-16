import { notFound } from "next/navigation";
import { UserProfileClient } from "@/components/profile/user-profile-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserProfile(userId: string) {
  try {
    const currentUser = await getCurrentDbUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: true,
        mentorProfile: true,
        _count: {
          select: {
            posts: true,
            sentConnectionRequests: true,
            receivedConnectionRequests: true
          }
        }
      }
    });

    if (!user) return null;

    let connectionStatus: "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "SELF" = "NONE";
    if (currentUser) {
      if (currentUser.id === userId) {
        connectionStatus = "SELF";
      } else {
        const connection = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: currentUser.id, receiverId: userId },
              { requesterId: userId, receiverId: currentUser.id }
            ]
          },
          select: { status: true }
        });
        if (connection) {
          connectionStatus = connection.status;
        }
      }
    }

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        channel: {
          select: { id: true, slug: true, name: true, universityName: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const student = user.studentProfile
      ? {
          fullName: user.studentProfile.fullName,
          country: user.studentProfile.country,
          gpa: Number(user.studentProfile.gpa),
          intendedMajor: user.studentProfile.intendedMajor,
          targetUniversities: user.studentProfile.targetUniversities,
          bio: user.studentProfile.bio,
          achievements: user.studentProfile.achievements
        }
      : null;
    const mentor = user.mentorProfile
      ? {
          fullName: user.mentorProfile.fullName,
          country: user.mentorProfile.country,
          university: user.mentorProfile.university,
          major: user.mentorProfile.major,
          graduationYear: user.mentorProfile.graduationYear,
          acceptedUniversities: user.mentorProfile.acceptedUniversities,
          bio: user.mentorProfile.bio,
          verificationBadge: user.mentorProfile.verificationBadge
        }
      : null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      studentProfile: student,
      mentorProfile: mentor,
      connectionStatus,
      _count: user._count,
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        createdAt: post.createdAt.toISOString(),
        upvotes: post.upvotes,
        channel: post.channel,
        commentCount: post._count.comments
      }))
    };
  } catch {
    return null;
  }
}

export default async function UserProfilePage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUserProfile(userId);

  if (!user) {
    notFound();
  }

  const displayName =
    user.studentProfile?.fullName ||
    user.mentorProfile?.fullName ||
    "Profile";

  return (
    <section className="page-content route-shell route-profile">
      <Breadcrumbs
        items={[
          { label: "Profile", href: "/profile" },
          { label: displayName }
        ]}
      />
      <UserProfileClient userId={userId} initialData={user} />
    </section>
  );
}
