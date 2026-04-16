import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { connectionRequestSchema } from "@/lib/validation";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ requesterId: currentUser.id }, { receiverId: currentUser.id }]
      },
      include: {
        requester: {
          select: {
            id: true,
            role: true,
            email: true,
            studentProfile: {
              select: { fullName: true }
            },
            mentorProfile: {
              select: { fullName: true }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            role: true,
            email: true,
            studentProfile: {
              select: { fullName: true }
            },
            mentorProfile: {
              select: { fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return ok({ connections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const payload = connectionRequestSchema.parse(await req.json());

    if (payload.receiverId === currentUser.id) {
      return badRequest("Cannot connect to yourself");
    }

    const receiver = await prisma.user.findUnique({
      where: { id: payload.receiverId },
      select: { id: true, isActive: true }
    });
    if (!receiver || !receiver.isActive) {
      return badRequest("Receiver is not active");
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUser.id, receiverId: payload.receiverId },
          { requesterId: payload.receiverId, receiverId: currentUser.id }
        ]
      }
    });
    if (existing) {
      return badRequest("Connection already exists or is pending");
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: currentUser.id,
        receiverId: payload.receiverId
      }
    });

    return ok({ connection }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
