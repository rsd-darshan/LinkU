import Stripe from "stripe";
import { headers } from "next/headers";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/services/stripe";
import { requireEnv } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");
    const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
    if (!sig || !secret) return badRequest("Missing webhook signature");
    const stripe = getStripeClient();

    const event = stripe.webhooks.constructEvent(body, sig, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return badRequest("Missing booking metadata");

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return badRequest("Booking not found");

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntentId) return badRequest("Missing payment intent");

      await prisma.transaction.upsert({
        where: { bookingId },
        create: {
          bookingId,
          userId: booking.studentId,
          stripePaymentIntentId: paymentIntentId,
          grossAmountCents: booking.totalAmountCents,
          platformFeeCents: booking.platformFeeCents,
          netAmountCents: booking.mentorPayoutCents
        },
        update: {
          stripePaymentIntentId: paymentIntentId
        }
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "UPCOMING" }
      });

      // Hook your email provider here (Resend, Postmark, SES, etc.)
      // Send student + mentor confirmation after successful checkout.
    }

    return ok({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
