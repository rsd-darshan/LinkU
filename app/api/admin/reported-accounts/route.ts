import { requireRole } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    // Placeholder until report workflow model is introduced.
    return ok({ reportedAccounts: [] });
  } catch (error) {
    return handleApiError(error);
  }
}
