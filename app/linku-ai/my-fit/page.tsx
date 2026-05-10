import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiMyFitClient } from "@/components/linku-ai/my-fit-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiMyFitPage() {
  await requireUserRedirect();

  const universities = await prisma.university.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: 300,
  });

  return (
    <section className="page-content" aria-labelledby="my-fit-title">
      <div className="page-header card-app">
        <h1 id="my-fit-title" className="page-title">
          My fit
        </h1>
        <p className="page-description">
          Select a university to see your relative fit score and band (Strong match, Competitive, Reach, or High
          reach) based on your profile and supplement essay.
        </p>
      </div>
      <LinkUAiMyFitClient universities={universities} />
    </section>
  );
}
