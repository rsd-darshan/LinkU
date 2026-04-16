import { NextResponse } from "next/server";
import { runFetchCron } from "@/lib/linku-ai/dataPipeline/cronScheduler";

const CRON_SECRET = process.env.LINKU_AI_CRON_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFetchCron();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[linku-ai cron]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
