import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiApplicationsClient } from "@/components/linku-ai/applications-client";
import { LottiePlayer } from "@/components/linku-ai/lottie-player";

export const dynamic = "force-dynamic";

const APPLICATIONS_LOTTIE_SRC =
  "https://lottie.host/d523dd5f-547f-4c8f-a33b-8630bc76ce03/uNkoA3RVxD.lottie";

export default async function LinkUAiApplicationsPage() {
  const user = await requireUserRedirect();

  const applications = await prisma.userUniversityApplication.findMany({
    where: { userId: user.id },
    include: {
      university: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section
      className="page-content animate-fade-in-up motion-reduce:animate-none"
      aria-labelledby="applications-title"
    >
      <header className="grid gap-8 pb-8 sm:pb-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div className="flex justify-center lg:justify-start">
          <LottiePlayer
            src={APPLICATIONS_LOTTIE_SRC}
            width={300}
            height={300}
            className="shrink-0"
          />
        </div>
        <div className="space-y-4 sm:space-y-5">
          <span
            className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-body-sm font-semibold tracking-wide text-brand-700"
            aria-hidden
          >
            LinkU AI
          </span>
          <h1
            id="applications-title"
            className="text-display font-bold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-[2.75rem]"
          >
            University applications
          </h1>
          <p className="max-w-xl text-body leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
            Add universities you’re applying to and store supplement essays per school. Search to find your university.
          </p>
          <div
            className="h-1 w-14 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 sm:w-16"
            aria-hidden
          />
        </div>
      </header>
      <LinkUAiApplicationsClient initialApplications={applications} />
    </section>
  );
}
