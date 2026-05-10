import Link from "next/link";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNavClient } from "@/components/layout/sidebar-nav-client";

export async function AppSidebarLeft() {
  const currentUser = await getCurrentDbUser();
  const joinedChannels = currentUser
    ? await prisma.channelMember.findMany({
        where: { userId: currentUser.id },
        include: {
          channel: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 6
      })
    : [];

  return <SidebarNavClient joinedChannels={joinedChannels} />;
}

export function AppSidebarRight() {
  return (
    <aside className="min-w-0" aria-label="Right sidebar">
      <div className="space-y-3">
        <section className="rounded-2xl border border-line bg-page-subtle p-4">
          <h2 className="text-title font-bold text-ink">Notifications</h2>
          <p className="mt-2 text-body-sm text-ink-secondary">
            Stay updated on connection requests, replies, and booking activity from one place.
          </p>
          <Link href="/notifications" className="btn-app-secondary mt-4 w-full font-bold">
            Open notifications
          </Link>
        </section>
        <section className="rounded-2xl border border-line bg-page-subtle p-4">
          <h2 className="text-title font-bold text-ink">Platform tips</h2>
          <ul className="mt-2 space-y-2 text-body-sm text-ink-secondary">
            <li>Post clear questions to get faster peer and mentor responses.</li>
            <li>Join relevant channels before posting for better visibility.</li>
            <li>Keep profile updated to improve discovery and matching quality.</li>
          </ul>
        </section>
      </div>
    </aside>
  );
}
