import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { RtcTokenBuilder, RtcRole } from "agora-token";

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

function hashUserIdToUid(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & 0x7fffffff;
  }
  return Math.max(1, hash);
}

export async function POST(request: NextRequest) {
  try {
    if (!APP_ID || !APP_CERTIFICATE) {
      return badRequest(
        "Agora is not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE to your .env"
      );
    }

    const currentUser = await requireUser();
    const body = await request.json();
    const { channelName } = body as { channelName?: string };

    if (!channelName || typeof channelName !== "string") {
      return badRequest("channelName is required");
    }

    const uid = hashUserIdToUid(currentUser.id);
    const tokenExpire = 3600;
    const privilegeExpire = 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      tokenExpire,
      privilegeExpire
    );

    return ok({
      token,
      uid,
      appId: APP_ID,
      channelName
    });
  } catch (error) {
    return handleApiError(error);
  }
}
