import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="page-content route-shell route-admin" aria-labelledby="admin-title">
      <div className="page-header route-hero">
        <span className="route-badge">Operations console</span>
        <h1 id="admin-title" className="page-title">Admin Panel</h1>
        <p className="page-description">Approve mentors, manage users, monitor transactions, and review reported accounts.</p>
      </div>
      <div className="card-app p-6 text-body-sm text-slate-700 space-y-4">
        <p>Approve mentors, manage users, monitor transactions, and review reported accounts.</p>
        <Link
          href="/admin/linku-ai"
          className="focus-ring inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          LinkU-AI: University data & review
        </Link>
      </div>
    </section>
  );
}
