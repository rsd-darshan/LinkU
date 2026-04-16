import { StatCard } from "@/components/dashboard/stat-card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await requireUser();
  const [bookingsCount, connectionsCount, messagesCount, studentProfile, mentorProfile] = await Promise.all([
    prisma.booking.count({
      where:
        currentUser.role === "STUDENT"
          ? { studentId: currentUser.id, status: "UPCOMING" }
          : currentUser.role === "MENTOR"
            ? { mentorId: currentUser.id, status: "UPCOMING" }
            : {}
    }),
    prisma.connection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: currentUser.id }, { receiverId: currentUser.id }]
      }
    }),
    prisma.message.count({
      where: { receiverId: currentUser.id }
    }),
    prisma.studentProfile.findUnique({ where: { userId: currentUser.id }, select: { id: true } }),
    prisma.mentorProfile.findUnique({ where: { userId: currentUser.id }, select: { id: true } })
  ]);

  const hasProfile = Boolean(studentProfile || mentorProfile);

  return (
    <section className="page-content route-shell route-dashboard" aria-labelledby="dashboard-title">
      <div className="page-header route-hero">
        <span className="route-badge">Your workspace</span>
        <h1 id="dashboard-title" className="page-title">Your dashboard</h1>
        <p className="page-description">
          See your recent activity and jump straight to sessions, connections, or messages.
        </p>
      </div>
      {!hasProfile ? (
        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-800" role="status">
          Finish your profile in <Link href="/profile" className="underline focus-ring rounded">Profile</Link> so people can find you and you can book sessions.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Upcoming Sessions" value={String(bookingsCount)} hint="Book your next mentor session" />
        <StatCard title="Connections" value={String(connectionsCount)} hint="Grow your trusted peer network" />
        <StatCard title="Unread Messages" value={String(messagesCount)} hint="Stay responsive to mentors and peers" />
      </div>
      <div className="card-app card-app--muted route-dashboard-quick-actions">
        <h2 className="text-title-sm font-semibold text-slate-900">Quick actions</h2>
        <p className="mt-1 text-caption text-slate-500">Jump to what you need most.</p>
        <ul className="mt-4 flex flex-wrap gap-3" role="list">
          <li>
            <Link href="/booking" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Book a session
            </Link>
          </li>
          <li>
            <Link href="/mentors" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Find mentors
            </Link>
          </li>
          <li>
            <Link href="/networking" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Find connections
            </Link>
          </li>
          <li>
            <Link href="/messages" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Open messages
            </Link>
          </li>
          <li>
            <Link href="/reviews" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Manage reviews
            </Link>
          </li>
          <li>
            <Link href="/linku-ai" className="focus-ring dashboard-quick-link inline-flex min-h-[44px] items-center rounded-input border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50">
              Admissions tools
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
