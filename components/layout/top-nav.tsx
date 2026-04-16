"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2v-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h16v10H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1.5-3.3 4.5-5 8-5s6.5 1.7 8 5" strokeLinecap="round" />
    </svg>
  );
}

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as Node;
      const isInput = target && ("tagName" in target && /^(INPUT|TEXTAREA|SELECT)$/.test((target as HTMLElement).tagName));
      if (isInput) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const links = [
    { href: "/", label: "Feed" },
    { href: "/channels", label: "Channels" },
    { href: "/networking", label: "Connections" },
    { href: "/mentors", label: "Mentors" },
    { href: "/dashboard", label: "Dashboard" }
  ];
  const utilityLinks = [
    { href: "/notifications", label: "Notifications", icon: <BellIcon /> },
    { href: "/messages", label: "Chat", icon: <ChatIcon /> },
    { href: "/profile", label: "Profile", icon: <UserIcon /> }
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) return;
    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
  }

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function utilityLinkClass(href: string) {
    if (isActive(href)) {
      return "border-brand-400/80 bg-brand-100/90 text-brand-800 shadow-[0_1px_2px_rgba(15,23,42,0.08)]";
    }
    return "border-slate-300/50 bg-white/75 text-slate-700 hover:-translate-y-px hover:border-slate-400/60 hover:bg-white/95 hover:text-slate-900";
  }

  return (
    <header className="glass-header fixed inset-x-0 top-0 z-40 border-b" role="banner">
      <div className="container-app flex h-14 min-h-touch items-center gap-2.5 sm:gap-3">
        <Link
          href="/"
          className="focus-ring flex min-w-fit items-center gap-2 rounded-lg px-1 py-2 text-body-sm font-semibold text-slate-900"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            L
          </span>
          <span>LinkU</span>
        </Link>
        <form
          className="search-form-nav relative hidden max-w-xl flex-1 md:block"
          onSubmit={onSubmit}
          suppressHydrationWarning
          role="search"
          aria-label="Search people, posts, and channels"
        >
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search people, posts & channels…"
            className="input-app h-11 min-h-0 w-full rounded-pill border-slate-300 bg-slate-50 py-2.5 pl-11 pr-4 text-body-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            suppressHydrationWarning
            aria-label="Search people, posts, and channels"
            autoComplete="off"
          />
          {!query.trim() ? (
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 sm:inline" aria-hidden>
              /
            </kbd>
          ) : null}
        </form>
        <nav className="hidden items-center gap-1.5 text-body-sm lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring rounded-pill border px-3 py-2 min-h-[44px] inline-flex items-center transition duration-normal ${
                isActive(link.href)
                  ? "border-brand-400/80 bg-brand-100/90 text-brand-800"
                  : "border-transparent text-slate-700 hover:-translate-y-px hover:border-slate-300/70 hover:bg-white/85 hover:text-slate-900"
              }`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="ml-auto flex items-center gap-1.5 text-body-sm" aria-label="Account and notifications">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border px-3 py-2 transition duration-normal ${utilityLinkClass(link.href)}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.icon as ReactNode}
              <span className="hidden xl:inline">{link.label}</span>
            </Link>
          ))}
          {clerkEnabled ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button type="button" className="btn-app-primary rounded-pill px-4 py-2">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="btn-app-primary rounded-pill px-4 py-2"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
