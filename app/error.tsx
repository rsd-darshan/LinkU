"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-card-lg border border-slate-200 bg-white p-8 shadow-card text-center">
        <h1 className="text-title font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-body-sm text-slate-600">
          We couldn’t load this page. Please try again.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-input border border-slate-300 bg-white px-4 py-2 text-body-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-input border border-brand-600 bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition hover:bg-brand-700"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
