import { requireUser } from "@/lib/auth";
import { handleApiError, ok, badRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { globalProfileSchema, type GlobalProfileInput } from "@/lib/linku-ai/schemas";

function toJson(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  return value ?? [];
}

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.userGlobalProfile.findUnique({
      where: { userId: user.id },
    });
    return ok(profile ?? null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as GlobalProfileInput;

    const parsed = globalProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const data = parsed.data;
    const ecasJson = toJson(data.ecasJson ?? []);
    const honorsJson = toJson(data.honorsJson ?? []);
    const awardsJson = toJson(data.awardsJson ?? []);
    const hooksJson = data.hooksJson != null ? toJson(data.hooksJson) : [];

    const profile = await prisma.userGlobalProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        gpa: data.gpa != null ? data.gpa : null,
        sat: data.sat ?? null,
        schoolContext: data.schoolContext ?? null,
        ecasJson: ecasJson as object,
        honorsJson: honorsJson as object,
        awardsJson: awardsJson as object,
        intendedMajor: data.intendedMajor ?? null,
        personalEssay: data.personalEssay ?? null,
        lorRating: data.lorRating ?? null,
        hooksJson: hooksJson as object,
        resumeUrl: data.resumeUrl && data.resumeUrl !== "" ? data.resumeUrl : null,
      },
      update: {
        gpa: data.gpa != null ? data.gpa : undefined,
        sat: data.sat ?? undefined,
        schoolContext: data.schoolContext ?? undefined,
        ecasJson: ecasJson as object,
        honorsJson: honorsJson as object,
        awardsJson: awardsJson as object,
        intendedMajor: data.intendedMajor ?? undefined,
        personalEssay: data.personalEssay ?? undefined,
        lorRating: data.lorRating ?? undefined,
        hooksJson: hooksJson as object,
        resumeUrl: data.resumeUrl && data.resumeUrl !== "" ? data.resumeUrl : null,
      },
    });

    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
