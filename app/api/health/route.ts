import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check for load balancers and uptime monitoring.
 * GET /api/health
 * - 200: app and DB are healthy.
 * - 503: DB (or critical dependency) is unavailable.
 * Does not require authentication.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp,
      checks: { database: "ok" },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Database unavailable",
        timestamp,
        checks: { database: "error" },
      },
      { status: 503 }
    );
  }
}
