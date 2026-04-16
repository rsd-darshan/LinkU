import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LinkUAiApplicationEditClient } from "@/components/linku-ai/application-edit-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiApplicationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUserRedirect();
  const { id } = await params;

  const application = await prisma.userUniversityApplication.findFirst({
    where: { id, userId: user.id },
    include: { university: true },
  });

  if (!application) notFound();

  const stats = application.universityId
    ? await prisma.universityStatistics.findFirst({
        where: { universityId: application.universityId, isActive: true },
        select: {
          gpa25: true,
          gpa50: true,
          gpa75: true,
          sat25: true,
          sat50: true,
          sat75: true,
          acceptanceRate: true,
        },
      })
    : null;

  const universityStatsDisplay = stats
    ? {
        gpa25: stats.gpa25 ? Number(stats.gpa25) : null,
        gpa50: stats.gpa50 ? Number(stats.gpa50) : null,
        gpa75: stats.gpa75 ? Number(stats.gpa75) : null,
        sat25: stats.sat25,
        sat50: stats.sat50,
        sat75: stats.sat75,
        acceptanceRate: stats.acceptanceRate ? Number(stats.acceptanceRate) : null,
      }
    : null;

  return (
    <section
      className="page-content animate-fade-in-up motion-reduce:animate-none"
      aria-labelledby="edit-application-title"
    >
      <header className="pb-8 sm:pb-10">
        <span
          className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-body-sm font-semibold tracking-wide text-brand-700"
          aria-hidden
        >
          LinkU AI
        </span>
        <h1
          id="edit-application-title"
          className="mt-2 text-display font-bold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-[2.75rem]"
        >
          Edit application — {application.university.name}
        </h1>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-slate-600">
          Update round, status, and supplement essays. Stored per university.
        </p>
        <div
          className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
          aria-hidden
        />
      </header>
      <LinkUAiApplicationEditClient application={application} universityStats={universityStatsDisplay} />
    </section>
  );
}
