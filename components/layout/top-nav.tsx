"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2v-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16v10H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="2">
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
    { href: "/messages", label: "Messages", icon: <ChatIcon /> },
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
      return "text-brand-500";
    }
    return "text-ink-secondary hover:bg-black/[0.07] hover:text-brand-500";
  }

  return (
    <header className="glass-header fixed inset-x-0 top-0 z-40 border-b border-line shadow-none" role="banner">
      <div className="layout-shell flex h-14 min-h-[3.5rem] items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="focus-ring flex min-w-fit items-center gap-2 rounded-full px-2 py-2 text-meta font-bold text-ink hover:bg-black/[0.07]"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
            L
          </span>
          <span className="hidden sm:inline">LinkU</span>
        </Link>
        <form
          className="search-form-nav relative hidden max-w-md flex-1 md:block"
          onSubmit={onSubmit}
          suppressHydrationWarning
          role="search"
          aria-label="Search people, posts, and channels"
        >
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search"
            className="h-11 min-h-0 w-full rounded-full border border-line bg-page-subtle py-2 pl-11 pr-10 text-body-sm text-ink placeholder:text-ink-secondary outline-none transition focus:border-brand-500 focus:bg-page focus:ring-1 focus:ring-brand-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            suppressHydrationWarning
            aria-label="Search people, posts, and channels"
            autoComplete="off"
          />
          {!query.trim() ? (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-page px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary sm:inline" aria-hidden>
              /
            </kbd>
          ) : null}
        </form>
        <nav className="hidden items-center gap-0.5 text-body-sm lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring rounded-full px-3 py-2 font-bold transition ${
                isActive(link.href)
                  ? "text-ink"
                  : "text-ink-secondary hover:bg-black/[0.07] hover:text-ink"
              }`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="ml-auto flex items-center gap-0.5 text-body-sm" aria-label="Account and notifications">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-2 rounded-full p-2 transition xl:px-3 ${utilityLinkClass(link.href)}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.icon as ReactNode}
              <span className="hidden font-bold lg:inline">{link.label}</span>
            </Link>
          ))}
          {clerkEnabled ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button type="button" className="btn-app-primary min-h-[40px] px-5 py-2 text-meta">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <Link href="/sign-in" className="btn-app-primary min-h-[40px] px-5 py-2 text-meta">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
