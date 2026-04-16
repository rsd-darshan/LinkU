import { prisma } from "@/lib/prisma";

export function calculateBookingAmounts(durationMinutes: 30 | 60, hourlyRateCents: number) {
  const totalAmountCents = durationMinutes === 30 ? Math.round(hourlyRateCents / 2) : hourlyRateCents;
  const platformFeeCents = Math.round(totalAmountCents * 0.15);
  const mentorPayoutCents = totalAmountCents - platformFeeCents;
  return { totalAmountCents, platformFeeCents, mentorPayoutCents };
}

export async function assertMentorAvailable(mentorId: string, startTime: Date, endTime: Date) {
  const overlapping = await prisma.booking.findFirst({
    where: {
      mentorId,
      status: { in: ["UPCOMING", "COMPLETED"] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime }
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime }
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      ]
    },
    select: { id: true }
  });

  if (overlapping) {
    throw new Error("Selected mentor time slot is no longer available");
  }
}
