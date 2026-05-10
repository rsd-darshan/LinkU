import { requireRole } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: { booking: true, user: true }
    });
    return ok({ transactions });
  } catch (error) {
    return handleApiError(error);
  }
}
