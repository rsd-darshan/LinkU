import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiInsightsClient } from "@/components/linku-ai/insights-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiInsightsPage() {
  const user = await requireUserRedirect();

  const applications = await prisma.userUniversityApplication.findMany({
    where: { userId: user.id },
    select: {
      universityId: true,
      university: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section className="page-content" aria-labelledby="insights-title">
      <div className="page-header card-app">
        <h1 id="insights-title" className="page-title">
          Advanced insights
        </h1>
        <p className="page-description">
          Supplement strength heatmap and major-switch simulation for your applications. Select a
          university to see your stored supplement analysis and simulate a different intended major.
        </p>
      </div>
      <LinkUAiInsightsClient applications={applications} />
    </section>
  );
}
