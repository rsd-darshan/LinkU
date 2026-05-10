"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type JoinedChannel = { channel: { id: string; name: string; slug: string } };

const primaryLinks = [
  { href: "/", label: "Feed", title: "See posts from your channels and network" },
  { href: "/dashboard", label: "Dashboard", title: "Your overview and quick actions" },
  { href: "/linku-ai", label: "LinkU-AI", title: "Admissions tools and comparisons" },
  { href: "/mentors", label: "Mentors", title: "Find and book mentors" },
  { href: "/channels", label: "Channels", title: "Find and join communities" },
  { href: "/networking", label: "Connections", title: "Meet peers and build your network" }
];

const utilityLinks = [
  { href: "/notifications", label: "Notifications", title: "Requests, replies, and activity" },
  { href: "/messages", label: "Messages", title: "Message your connections" },
  { href: "/profile", label: "Profile", title: "Your profile and settings" }
];

const iconClass = "h-[26px] w-[26px] shrink-0";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3v-10.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20v-4" strokeLinecap="round" /></svg>;
}
function GraduationIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-4 9 4-9 4-9-4Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" strokeLinecap="round" /></svg>;
}
function GlobeIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M15 20c0-2.3 1.6-4 4-4" strokeLinecap="round" /></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2v-5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
}
function ChatIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v10H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SparklesIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.5 4.5L6 8l4.5 1.5L12 14l1.5-4.5L18 8l-4.5-1.5L12 3Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 21v-2M19 21v-2M3 5v2M21 5v2" strokeLinecap="round" /></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M4 20c1.5-3.3 4.5-5 8-5s6.5 1.7 8 5" strokeLinecap="round" /></svg>;
}

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
  const linkBase =
    "focus-ring flex w-full min-w-0 items-center gap-4 rounded-full py-2.5 pl-2 pr-3 text-[1.0625rem] font-semibold leading-snug tracking-snug transition-colors duration-fast xl:gap-5 xl:pl-3 xl:pr-4";
  const linkActive = "font-bold text-ink";
  const linkInactive = "text-ink-secondary hover:bg-black/[0.07] hover:text-ink";

  return (
    <aside className="flex min-h-0 min-w-0 flex-col" aria-label="Sidebar">
      <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
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
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="focus-ring mt-4 inline-flex w-full max-w-[280px] items-center justify-center rounded-full bg-brand-500 py-3 text-center text-body-sm font-bold text-white shadow-none transition hover:brightness-95"
        title="Compose a post on the feed"
      >
        Post
      </Link>

      <div className="mt-8 border-t border-line pt-4">
        <p className="px-2 pb-2 text-meta font-bold uppercase tracking-wide text-ink-secondary">Joined channels</p>
        <div className="flex max-h-48 flex-col gap-0 overflow-y-auto scrollbar-hide">
          {joinedChannels.length === 0 ? (
            <p className="px-3 py-2 text-meta text-ink-secondary">Join a channel to list it here.</p>
          ) : (
            joinedChannels.map((entry) => (
              <Link
                key={entry.channel.id}
                href={`/channels?slug=${entry.channel.slug}`}
                className={`${linkBase} text-meta font-semibold text-brand-600 hover:bg-black/[0.07] hover:text-brand-700`}
              >
                <GlobeIcon />
                <span className="truncate">/{entry.channel.slug}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-0.5 border-t border-line pt-4" aria-label="Quick links">
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
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
