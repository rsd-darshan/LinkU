"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Plus } from "lucide-react";

type University = { id: string; name: string; slug: string };
type Application = {
  id: string;
  universityId: string;
  round: string;
  financialAidRequest: boolean | null;
  supplementEssay: string | null;
  supplementEssaysJson?: unknown;
  status: string;
  university: University;
};

function hasSupplementContent(app: Application): boolean {
  if (app.supplementEssay?.trim()) return true;
  const arr = app.supplementEssaysJson;
  if (!Array.isArray(arr)) return false;
  return arr.some(
    (item: unknown) =>
      item &&
      typeof item === "object" &&
      "answer" in item &&
      String((item as Record<string, unknown>).answer ?? "").trim() !== ""
  );
}

const styles = {
  btnPrimary:
    "focus-ring inline-flex min-h-[44px] items-center justify-center gap-2 rounded-input bg-brand-600 px-5 py-2.5 text-body-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-brand-700 motion-reduce:transition-none",
  emptyState:
    "py-10 sm:py-12 text-center text-body-sm text-slate-500 rounded-input border border-dashed border-slate-200 bg-slate-50/50",
} as const;

export function LinkUAiApplicationsClient({
  initialApplications,
}: {
  initialApplications: Application[];
}) {
  const applications = initialApplications;

  return (
    <div className="page-content space-y-8">
      <section aria-labelledby="applications-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <h2 id="applications-list-heading" className="text-title-sm font-semibold text-slate-900">
            Your applications
          </h2>
          <Link
            href="/linku-ai/applications/new"
            className="add-application-btn focus-ring"
            aria-label="Add application"
          >
            <span className="add-application-icon" aria-hidden />
            <span className="add-application-btn-txt">Add application</span>
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="max-w-sm mx-auto">
              No applications yet. Add a university to track supplements and round details.
            </p>
            <Link
              href="/linku-ai/applications/new"
              className={styles.btnPrimary + " mt-4 inline-flex"}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Add your first application
            </Link>
          </div>
        ) : (
          <nav aria-label="Application list" className="-mx-1 sm:-mx-2">
            <ul className="divide-y divide-slate-200/50" role="list">
              {applications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/linku-ai/applications/${app.id}`}
                    className="focus-ring group flex min-h-[72px] w-full items-center gap-4 border-l-4 border-l-transparent py-4 pl-3 pr-4 transition-[border-color,background-color] duration-200 ease-out hover:border-l-brand-500 hover:bg-white/80 motion-reduce:transition-none sm:pl-4 sm:pr-5"
                    aria-label={`Edit application: ${app.university.name}, ${app.round}`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-brand-100 group-hover:text-brand-600"
                      aria-hidden
                    >
                      <GraduationCap className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 group-hover:text-brand-700">
                        {app.university.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                          {app.round}
                        </span>
                        {hasSupplementContent(app) && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-700">
                            Supplement saved
                          </span>
                        )}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-brand-500"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </div>
  );
}
