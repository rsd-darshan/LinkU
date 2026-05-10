import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-card-lg border border-slate-200 bg-white p-8 shadow-card text-center">
        <h1 className="text-display font-semibold text-slate-900">404</h1>
        <p className="mt-2 text-body text-slate-600">This page doesn’t exist or was moved.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-input bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition hover:bg-brand-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
