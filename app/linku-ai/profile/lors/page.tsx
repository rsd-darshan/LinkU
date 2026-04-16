import Link from "next/link";
import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiLorsClient } from "@/components/linku-ai/lors-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiLorsPage() {
  const user = await requireUserRedirect();
  const lors = await prisma.lor.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="page-content" aria-labelledby="lors-title">
      <div className="page-header card-app">
        <h1 id="lors-title" className="page-title">
          Letters of recommendation
        </h1>
        <p className="page-description">
          Add LORs with strength (1–10), relationship depth (1–10), and credibility (1–10). Used in comparison and context scoring.
        </p>
        <Link
          href="/linku-ai/profile"
          className="focus-ring mt-3 inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          Back to profile
        </Link>
      </div>
      <LinkUAiLorsClient initialLors={lors} />
    </section>
  );
}
