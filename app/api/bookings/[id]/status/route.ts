import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const { status } = (await req.json()) as { status?: "COMPLETED" | "CANCELED" };
    if (!status) return badRequest("status is required");

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return notFound("Booking not found");
    if (![booking.studentId, booking.mentorId].includes(currentUser.id) && currentUser.role !== "ADMIN") {
      return badRequest("No permission to update this booking");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        canceledAt: status === "CANCELED" ? new Date() : null
      }
    });
    return ok({ booking: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
