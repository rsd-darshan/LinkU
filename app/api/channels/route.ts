import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizeText, toSlug } from "@/lib/sanitize";
import { channelCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            members: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
    return ok({ channels });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const payload = channelCreateSchema.parse(await req.json());

    const baseSlug = toSlug(payload.name);
    if (!baseSlug) return badRequest("Invalid channel name");

    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.channel.findUnique({ where: { slug }, select: { id: true } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const channel = await prisma.channel.create({
      data: {
        name: sanitizeText(payload.name),
        slug,
        universityName: payload.universityName ? sanitizeText(payload.universityName) : null,
        description: payload.description ? sanitizeText(payload.description) : null,
        createdById: currentUser.id,
        members: {
          create: {
            userId: currentUser.id
          }
        }
      }
    });

    return ok({ channel }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
