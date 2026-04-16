"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type JoinedChannel = { channel: { id: string; name: string; slug: string } };

const primaryLinks = [
  { href: "/", label: "Feed", title: "See posts from your channels and network" },
  { href: "/dashboard", label: "Dashboard", title: "Your overview and quick actions" },
  { href: "/linku-ai", label: "LinkU-AI", title: "Admissions intelligence and comparison" },
  { href: "/mentors", label: "Mentors", title: "Find and book mentors" },
  { href: "/channels", label: "Channels", title: "Discover and join communities" },
  { href: "/networking", label: "Connections", title: "Find peers and connect" }
];

const utilityLinks = [
  { href: "/notifications", label: "Notifications", title: "Connection requests and activity" },
  { href: "/messages", label: "Messages", title: "Message your connections" },
  { href: "/profile", label: "Profile", title: "Your profile and settings" }
];

function HomeIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3v-10.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ChartIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20v-4" strokeLinecap="round" /></svg>; }
function GraduationIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 9 9-4 9 4-9 4-9-4Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" strokeLinecap="round" /></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>; }
function UsersIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M15 20c0-2.3 1.6-4 4-4" strokeLinecap="round" /></svg>; }
function BellIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2v-5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>; }
function ChatIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5h16v10H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function SparklesIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3-1.5 4.5L6 8l4.5 1.5L12 14l1.5-4.5L18 8l-4.5-1.5L12 3Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 21v-2M19 21v-2M3 5v2M21 5v2" strokeLinecap="round" /></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M4 20c1.5-3.3 4.5-5 8-5s6.5 1.7 8 5" strokeLinecap="round" /></svg>; }

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": HomeIcon,
  "/dashboard": ChartIcon,
  "/linku-ai": SparklesIcon,
  "/mentors": GraduationIcon,
  "/channels": GlobeIcon,
  "/networking": UsersIcon,
  "/notifications": BellIcon,
  "/messages": ChatIcon,
  "/profile": ProfileIcon
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavClient({ joinedChannels }: { joinedChannels: JoinedChannel[] }) {
  const pathname = usePathname();
  const linkBase = "focus-ring flex min-h-[44px] items-center rounded-input text-body-sm transition duration-normal gap-2 px-3 py-2";
  const linkActive = "border border-brand-400/75 bg-brand-100/90 font-semibold text-brand-800 shadow-[0_1px_2px_rgba(15,23,42,0.08)]";
  const linkInactive = "border border-transparent text-slate-700 hover:-translate-y-px hover:border-slate-300/60 hover:bg-white/85 hover:text-slate-900";

  return (
    <aside className="hidden xl:block" aria-label="Sidebar">
      <div className="sticky top-14 space-y-3.5">
        <section className="card-app p-4" aria-labelledby="sidebar-main-heading">
          <h2 id="sidebar-main-heading" className="flex items-center gap-1.5 text-title-sm text-slate-900">
            Navigate
          </h2>
          <p className="mt-1 text-caption text-slate-500">Main sections — you are here when highlighted.</p>
          <nav className="mt-3 space-y-1" aria-label="Main navigation">
            {primaryLinks.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = iconMap[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.title}
                  className={`${linkBase} ${active ? linkActive : linkInactive}`}
                  aria-current={active ? "page" : undefined}
                >
                  {Icon ? <Icon /> : null}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </section>

        <section className="card-app p-4" aria-labelledby="sidebar-channels-heading">
          <h2 id="sidebar-channels-heading" className="flex items-center gap-1.5 text-title-sm text-slate-900">
            <GlobeIcon />
            Joined channels
          </h2>
          <div className="mt-3 space-y-1">
            {joinedChannels.length === 0 ? (
              <p className="text-caption text-slate-500">Join channels from the Channels page to see them here.</p>
            ) : (
              joinedChannels.map((entry) => (
                <Link
                  key={entry.channel.id}
                  href={`/channels?slug=${entry.channel.slug}`}
                  className={`${linkBase} ${linkInactive}`}
                >
                  <GlobeIcon />
                  <span>/{entry.channel.slug}</span>
                </Link>
              ))
            )}
          </div>
        </section>
        <section className="card-app p-4" aria-labelledby="sidebar-quick-heading">
          <h2 id="sidebar-quick-heading" className="flex items-center gap-1.5 text-title-sm text-slate-900">
            Quick access
          </h2>
          <nav className="mt-3 space-y-1" aria-label="Quick access">
            {utilityLinks.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = iconMap[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.title}
                  className={`${linkBase} ${active ? linkActive : linkInactive}`}
                  aria-current={active ? "page" : undefined}
                >
                  {Icon ? <Icon /> : null}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </aside>
  );
}
