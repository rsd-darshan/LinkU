import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { connectionRespondSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const payload = connectionRespondSchema.parse(await req.json());

    const connection = await prisma.connection.findUnique({
      where: { id: payload.connectionId }
    });
    if (!connection) return notFound("Connection not found");
    if (connection.receiverId !== currentUser.id) {
      return badRequest("Only receiver can respond");
    }
    if (connection.status !== "PENDING") {
      return badRequest("Connection already handled");
    }

    const updated = await prisma.connection.update({
      where: { id: payload.connectionId },
      data: { status: payload.action }
    });

    return ok({ connection: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
