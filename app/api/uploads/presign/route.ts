import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { sanitizeText } from "@/lib/sanitize";
import { getPresignedUploadUrl } from "@/services/upload";
import { presignSchema } from "@/lib/validation";
import { getS3Config } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await req.json();
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const { fileName, contentType } = parsed.data;

    const safeName = sanitizeText(fileName).replace(/\s+/g, "-");
    const key = `users/${currentUser.id}/${Date.now()}-${safeName}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const s3Config = getS3Config();
    const publicBaseUrl =
      s3Config.publicBaseUrl ||
      (s3Config.bucket && s3Config.region
        ? `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`
        : null);

    return ok({ key, uploadUrl, publicUrl: publicBaseUrl ? `${publicBaseUrl}/${key}` : null });
  } catch (error) {
    return handleApiError(error);
  }
}
