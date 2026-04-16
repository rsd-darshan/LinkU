"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChannelsTrendingSidebar } from "@/components/layout/channels-trending-sidebar";

export function RightSidebarConditional() {
  const pathname = usePathname();
  if (!pathname) return null;
  if (pathname.startsWith("/channels")) return <ChannelsTrendingSidebar />;
  if (pathname.startsWith("/messages")) return null;

  return (
    <aside className="hidden xl:block" aria-label="Right sidebar">
      <div className="sticky top-14 space-y-4">
        <section className="card-app p-4" aria-labelledby="what-you-can-do-heading">
          <h2 id="what-you-can-do-heading" className="text-title-sm font-semibold text-slate-900">Try this next</h2>
          <p className="mt-1 text-caption text-slate-500">Quick shortcuts for common tasks.</p>
          <ul className="mt-3 space-y-2" role="list">
            <li>
              <Link href="/mentors" className="focus-ring block rounded-input px-3 py-2 text-body-sm text-slate-700 transition hover:bg-white/80">
                Find mentors and book a session
              </Link>
            </li>
            <li>
              <Link href="/networking" className="focus-ring block rounded-input px-3 py-2 text-body-sm text-slate-700 transition hover:bg-white/80">
                Find connections
              </Link>
            </li>
            <li>
              <Link href="/messages" className="focus-ring block rounded-input px-3 py-2 text-body-sm text-slate-700 transition hover:bg-white/80">
                Message your connections
              </Link>
            </li>
            <li>
              <Link href="/channels" className="focus-ring block rounded-input px-3 py-2 text-body-sm text-slate-700 transition hover:bg-white/80">
                Browse channels
              </Link>
            </li>
            <li>
              <Link href="/search" className="focus-ring block rounded-input px-3 py-2 text-body-sm text-slate-700 transition hover:bg-white/80">
                Search people & posts
              </Link>
            </li>
          </ul>
        </section>
        <section className="card-app p-4" aria-labelledby="notifications-sidebar-heading">
          <h2 id="notifications-sidebar-heading" className="text-title-sm font-semibold text-slate-900">Notifications</h2>
          <p className="mt-2 text-body-sm text-slate-600">
            Connection requests, replies, and booking activity.
          </p>
          <Link
            href="/notifications"
            className="btn-app-secondary mt-3"
          >
            View notifications
          </Link>
        </section>
        <section className="card-app p-4" aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="text-title-sm font-semibold text-slate-900">Tips</h2>
          <ul className="mt-2 space-y-2 text-body-sm text-slate-600">
            <li>Post clear questions to get faster responses.</li>
            <li>Join channels before posting for better visibility.</li>
            <li>Keep your profile updated for better matching.</li>
          </ul>
        </section>
      </div>
    </aside>
  );
}
