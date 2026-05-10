import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLinkUAiClient } from "@/components/linku-ai/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminLinkUAiPage() {
  await requireRole(["ADMIN"]);

  const [rawCount, statsCount, universitiesCount] = await Promise.all([
    prisma.universityRawData.count(),
    prisma.universityStatistics.count({ where: { isActive: false, approvedAt: null } }),
    prisma.university.count(),
  ]);

  return (
    <section className="page-content route-shell route-admin" aria-labelledby="admin-linku-ai-title">
      <div className="page-header route-hero">
        <span className="route-badge">Data governance</span>
        <h1 id="admin-linku-ai-title" className="page-title">
          LinkU-AI admin
        </h1>
        <p className="page-description">
          Review raw university data, create or approve statistics, and manage universities.
        </p>
        <Link
          href="/admin"
          className="focus-ring mt-3 inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          Back to admin
        </Link>
      </div>
      <AdminLinkUAiClient
        rawCount={rawCount}
        pendingStatsCount={statsCount}
        universitiesCount={universitiesCount}
      />
    </section>
  );
}
