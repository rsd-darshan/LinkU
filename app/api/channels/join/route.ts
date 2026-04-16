import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const { channelId } = (await req.json()) as { channelId?: string };
    if (!channelId) return badRequest("channelId is required");

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true }
    });
    if (!channel) return badRequest("Channel not found");

    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId: currentUser.id
        }
      },
      create: {
        channelId,
        userId: currentUser.id
      },
      update: {}
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
