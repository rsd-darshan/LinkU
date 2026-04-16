import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function NotificationsPage() {
  await requireUser();

  return (
    <section className="page-content route-shell route-notifications" aria-labelledby="notifications-title">
      <div className="page-header route-hero">
        <span className="route-badge">Activity inbox</span>
        <h1 id="notifications-title" className="page-title">Notifications</h1>
        <p className="page-description">
          Track your latest activity across connections, messages, channels, and mentoring.
        </p>
      </div>
      <div className="grid gap-3">
        <article className="card-app">
          <h2 className="text-title-sm text-slate-900">Connection activity</h2>
          <p className="mt-1 text-body-sm text-slate-600">New requests and responses will appear here.</p>
          <Link href="/networking" className="focus-ring mt-3 inline-flex min-h-[44px] items-center text-body-sm font-medium text-brand-600 hover:text-brand-700">
            Open Connections
          </Link>
        </article>
        <article className="card-app">
          <h2 className="text-title-sm text-slate-900">Chat activity</h2>
          <p className="mt-1 text-body-sm text-slate-600">Unread conversations and mentions will appear here.</p>
          <Link href="/messages" className="focus-ring mt-3 inline-flex min-h-[44px] items-center text-body-sm font-medium text-brand-600 hover:text-brand-700">
            Open Chat
          </Link>
        </article>
      </div>
    </section>
  );
}
