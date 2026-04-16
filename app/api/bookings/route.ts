import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { bookingCreateSchema } from "@/lib/validation";
import { assertMentorAvailable, calculateBookingAmounts } from "@/services/booking";
import { getStripeClient } from "@/services/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const bookings = await prisma.booking.findMany({
      where:
        currentUser.role === "STUDENT"
          ? { studentId: currentUser.id }
          : currentUser.role === "MENTOR"
            ? { mentorId: currentUser.id }
            : {},
      orderBy: { startTime: "asc" }
    });
    return ok({ bookings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (currentUser.role !== "STUDENT") return badRequest("Only students can create bookings");

    const payload = bookingCreateSchema.parse(await req.json());
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: payload.mentorId },
      include: { user: true }
    });
    if (!mentorProfile) return badRequest("Mentor not found");
    if (mentorProfile.verificationStatus !== "APPROVED") return badRequest("Mentor is not verified");
    if (payload.startTime < new Date()) return badRequest("Cannot book past time slots");
    if (!mentorProfile.availableTimeSlots.some((slot) => slot.getTime() === payload.startTime.getTime())) {
      return badRequest("Selected time is not in mentor availability");
    }

    const endTime = new Date(payload.startTime.getTime() + payload.durationMinutes * 60_000);
    await assertMentorAvailable(payload.mentorId, payload.startTime, endTime);

    const { totalAmountCents, platformFeeCents, mentorPayoutCents } = calculateBookingAmounts(
      payload.durationMinutes,
      mentorProfile.hourlyRateCents
    );
    const stripe = getStripeClient();

    const draftBooking = await prisma.booking.create({
      data: {
        studentId: currentUser.id,
        mentorId: payload.mentorId,
        durationMinutes: payload.durationMinutes,
        startTime: payload.startTime,
        endTime,
        totalAmountCents,
        platformFeeCents,
        mentorPayoutCents
      }
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${APP_URL}/booking?status=success`,
      cancel_url: `${APP_URL}/booking?status=canceled`,
      metadata: {
        bookingId: draftBooking.id,
        studentId: currentUser.id,
        mentorId: payload.mentorId
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: totalAmountCents,
            product_data: {
              name: `${payload.durationMinutes} minute mentor session`
            }
          }
        }
      ]
    });

    await prisma.booking.update({
      where: { id: draftBooking.id },
      data: { stripeSessionId: checkoutSession.id }
    });

    return ok(
      {
        bookingId: draftBooking.id,
        checkoutUrl: checkoutSession.url
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
