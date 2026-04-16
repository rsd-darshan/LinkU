import { requireUserRedirect } from "@/lib/auth";
import { ApplicationNewClient } from "@/components/linku-ai/application-new-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiApplicationNewPage() {
  await requireUserRedirect();

  return (
    <section
      className="page-content animate-fade-in-up motion-reduce:animate-none"
      aria-labelledby="new-application-title"
    >
      <header className="pb-8 sm:pb-10">
        <span
          className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-body-sm font-semibold tracking-wide text-brand-700"
          aria-hidden
        >
          LinkU AI
        </span>
        <h1 id="new-application-title" className="mt-2 text-display font-bold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-[2.75rem]">
          Add application
        </h1>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-slate-600">
          Choose a university, round, and status. Optionally add a first supplement—you can add more on the next page.
        </p>
        <div
          className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
          aria-hidden
        />
      </header>
      <ApplicationNewClient />
    </section>
  );
}
