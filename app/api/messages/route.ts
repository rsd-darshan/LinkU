import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canUsersMessage } from "@/services/chat-access";
import { messageCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return badRequest("userId is required");
    }

    const allowed = await canUsersMessage({
      senderId: currentUser.id,
      receiverId: userId
    });
    if (!allowed) {
      return badRequest("You cannot message this user");
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: userId },
          { senderId: userId, receiverId: currentUser.id }
        ]
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        body: true,
        createdAt: true
      }
    });

    return ok({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await request.json();
    const parsed = messageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const { receiverId, body: messageBody, messageType, postId, connectionId, bookingId } = parsed.data;

    const allowed = await canUsersMessage({
      senderId: currentUser.id,
      receiverId,
      connectionId,
      bookingId
    });
    if (!allowed) {
      return badRequest("You cannot message this user");
    }

    let connectionIdToUse: string | null = null;
    let bookingIdToUse: string | null = null;

    if (connectionId) {
      connectionIdToUse = connectionId;
    } else if (bookingId) {
      bookingIdToUse = bookingId;
    } else {
      const connection = await prisma.connection.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { requesterId: currentUser.id, receiverId },
            { requesterId: receiverId, receiverId: currentUser.id }
          ]
        },
        select: { id: true }
      });
      if (connection) connectionIdToUse = connection.id;
      else {
        const booking = await prisma.booking.findFirst({
          where: {
            OR: [
              { studentId: currentUser.id, mentorId: receiverId },
              { studentId: receiverId, mentorId: currentUser.id }
            ],
            status: { in: ["UPCOMING", "COMPLETED"] }
          },
          select: { id: true }
        });
        if (booking) bookingIdToUse = booking.id;
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        receiverId,
        body: messageBody.trim(),
        messageType: messageType ?? "TEXT",
        postId: postId ?? null,
        connectionId: connectionIdToUse,
        bookingId: bookingIdToUse
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        body: true,
        createdAt: true
      }
    });

    return ok({ message });
  } catch (error) {
    return handleApiError(error);
  }
}
