import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { canUsersMessage } from "@/services/chat-access";
import { prisma } from "@/lib/prisma";

/** Agora channel names must be ≤64 bytes and use only a-z, A-Z, 0-9, and limited symbols. */
function generateChannelName(): string {
  const t = Date.now().toString(36);
  const r = randomBytes(8).toString("hex");
  return `linku-${t}-${r}`;
}

const pendingInvites = new Map<string, { from: string; fromName: string; channelName: string; timestamp: number }[]>();
const declinedCalls = new Map<string, { declinedByName: string; timestamp: number }>();

const INVITE_TTL_MS = 60000;
const DECLINED_TTL_MS = 60000;

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await request.json();
    const { to: receiverId } = body as { to?: string };

    if (!receiverId) return badRequest("to (receiverId) is required");

    const allowed = await canUsersMessage({
      senderId: currentUser.id,
      receiverId
    });
    if (!allowed) return badRequest("You cannot call this user");

    const [student, mentor] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: currentUser.id }, select: { fullName: true } }),
      prisma.mentorProfile.findUnique({ where: { userId: currentUser.id }, select: { fullName: true } })
    ]);
    const fromName = student?.fullName || mentor?.fullName || "Unknown";
    const channelName = generateChannelName();

    const key = `invite:${receiverId}`;
    const invites = pendingInvites.get(key) || [];
    invites.push({
      from: currentUser.id,
      fromName,
      channelName,
      timestamp: Date.now()
    });
    pendingInvites.set(key, invites);

    return ok({ channelName, success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const { searchParams } = request.nextUrl;
    const channelName = searchParams.get("channelName");

    if (channelName) {
      const declined = declinedCalls.get(channelName);
      const now = Date.now();
      if (declined && now - declined.timestamp < DECLINED_TTL_MS) {
        declinedCalls.delete(channelName);
        return ok({ status: "declined", declinedByName: declined.declinedByName });
      }
      return ok({ status: "pending" });
    }

    const userId = currentUser.id;
    const key = `invite:${userId}`;
    const invites = pendingInvites.get(key) || [];
    const now = Date.now();
    const valid = invites.filter((inv) => now - inv.timestamp < INVITE_TTL_MS);

    if (valid.length === 0) {
      pendingInvites.delete(key);
    } else {
      pendingInvites.set(key, valid);
    }

    return ok({
      invites: valid.map((inv) => ({
        from: inv.from,
        fromName: inv.fromName,
        channelName: inv.channelName
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const { searchParams } = request.nextUrl;
    const channelName = searchParams.get("channelName");

    if (!channelName) return badRequest("channelName is required");

    const key = `invite:${currentUser.id}`;
    const invites = pendingInvites.get(key) || [];
    const filtered = invites.filter((inv) => inv.channelName !== channelName);
    if (filtered.length === 0) {
      pendingInvites.delete(key);
    } else {
      pendingInvites.set(key, filtered);
    }

    const [student, mentor] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: currentUser.id }, select: { fullName: true } }),
      prisma.mentorProfile.findUnique({ where: { userId: currentUser.id }, select: { fullName: true } })
    ]);
    const declinedByName = student?.fullName || mentor?.fullName || "User";
    declinedCalls.set(channelName, { declinedByName, timestamp: Date.now() });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
