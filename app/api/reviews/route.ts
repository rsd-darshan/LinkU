import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { reviewCreateSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { updateMentorRatingAggregate } from "@/services/review";

export async function GET() {
  try {
    const currentUser = await requireRole(["STUDENT"]);
    const [eligibleBookings, submittedReviews] = await Promise.all([
      prisma.booking.findMany({
        where: {
          studentId: currentUser.id,
          status: "COMPLETED",
          review: null
        },
        include: {
          mentor: {
            select: {
              id: true,
              mentorProfile: {
                select: {
                  fullName: true,
                  university: true
                }
              }
            }
          }
        },
        orderBy: { startTime: "desc" }
      }),
      prisma.review.findMany({
        where: { reviewerId: currentUser.id },
        include: {
          booking: {
            select: {
              startTime: true,
              mentor: {
                select: {
                  mentorProfile: {
                    select: { fullName: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return ok({ eligibleBookings, submittedReviews });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireRole(["STUDENT"]);
    const payload = reviewCreateSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId }
    });
    if (!booking) return notFound("Booking not found");
    if (booking.studentId !== currentUser.id) return badRequest("Booking does not belong to this user");
    if (booking.status !== "COMPLETED") return badRequest("Review allowed only for completed bookings");

    const existing = await prisma.review.findUnique({ where: { bookingId: payload.bookingId } });
    if (existing) return badRequest("Review already exists for this booking");

    const review = await prisma.review.create({
      data: {
        bookingId: payload.bookingId,
        reviewerId: currentUser.id,
        mentorId: booking.mentorId,
        rating: payload.rating,
        comment: payload.comment ? sanitizeText(payload.comment) : null
      }
    });

    await updateMentorRatingAggregate(booking.mentorId);
    return ok({ review }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
