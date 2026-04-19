"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChannelsTrendingSidebar } from "@/components/layout/channels-trending-sidebar";

function panelClass() {
  return "rounded-2xl border border-line bg-page-subtle p-4";
}

export function RightSidebarConditional() {
  const pathname = usePathname();
  if (pathname?.startsWith("/channels")) return <ChannelsTrendingSidebar />;

  return (
    <aside className="min-w-0" aria-label="Right sidebar">
      <div className="space-y-3">
        <section className={panelClass()} aria-labelledby="what-you-can-do-heading">
          <h2 id="what-you-can-do-heading" className="text-title font-bold text-ink">
            Try this next
          </h2>
          <ul className="mt-3 space-y-0 divide-y divide-line" role="list">
            <li>
              <Link href="/mentors" className="focus-ring block py-3 text-body-sm font-semibold text-ink hover:text-brand-500">
                Find mentors and book a session
              </Link>
            </li>
            <li>
              <Link href="/networking" className="focus-ring block py-3 text-body-sm font-semibold text-ink hover:text-brand-500">
                Find connections
              </Link>
            </li>
            <li>
              <Link href="/messages" className="focus-ring block py-3 text-body-sm font-semibold text-ink hover:text-brand-500">
                Message your connections
              </Link>
            </li>
            <li>
              <Link href="/channels" className="focus-ring block py-3 text-body-sm font-semibold text-ink hover:text-brand-500">
                Browse channels
              </Link>
            </li>
            <li>
              <Link href="/search" className="focus-ring block py-3 text-body-sm font-semibold text-ink hover:text-brand-500">
                Search people & posts
              </Link>
            </li>
          </ul>
        </section>
        <section className={panelClass()} aria-labelledby="notifications-sidebar-heading">
          <h2 id="notifications-sidebar-heading" className="text-title font-bold text-ink">
            Notifications
          </h2>
          <p className="mt-2 text-body-sm text-ink-secondary">Connection requests, replies, and booking activity.</p>
          <Link href="/notifications" className="btn-app-secondary mt-4 w-full font-bold">
            View notifications
          </Link>
        </section>
        <section className={panelClass()} aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="text-title font-bold text-ink">
            Tips
          </h2>
          <ul className="mt-2 space-y-2 text-body-sm text-ink-secondary">
            <li>Post clear questions to get faster responses.</li>
            <li>Join channels before posting for better visibility.</li>
            <li>Keep your profile updated for better matching.</li>
          </ul>
        </section>
      </div>
    </aside>
  );
}
