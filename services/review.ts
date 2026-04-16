import { prisma } from "@/lib/prisma";

export async function updateMentorRatingAggregate(mentorUserId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { mentorId: mentorUserId },
    _avg: { rating: true },
    _count: { rating: true }
  });

  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { id: true }
  });
  if (!mentor) return;

  await prisma.mentorProfile.update({
    where: { userId: mentorUserId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating
    }
  });
}
