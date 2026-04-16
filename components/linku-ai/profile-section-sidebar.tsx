"use client";

import { useEffect, useState } from "react";

const PROFILE_BASE = "/linku-ai/profile";
const profileSections = [
  { id: "academic", label: "Grades & scores" },
  { id: "activities", label: "Stand out" },
  { id: "essay", label: "Tell your story" },
  { id: "lors", label: "Who vouches for you" },
] as const;

function useHash() {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash.slice(1).toLowerCase() : ""
  );
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1).toLowerCase());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

const DEFAULT_SECTION = "academic";

export function ProfileSectionSidebar() {
  const currentHash = useHash();
  const effectiveHash = currentHash || DEFAULT_SECTION;
  const linkBase =
    "focus-ring flex min-h-[44px] shrink-0 items-center rounded-full border px-4 py-2.5 text-body-sm font-medium whitespace-nowrap transition-colors duration-200 ease-out motion-reduce:transition-none";
  const linkActive =
    "border-brand-600 bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:border-brand-700";
  const linkInactive =
    "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100/80 hover:text-slate-900";

  return (
    <nav
      className="w-full rounded-input border border-slate-200/70 bg-gradient-to-r from-slate-50/60 via-transparent to-slate-50/60 px-2.5 py-2 sm:px-3 sm:py-2.5"
      aria-label="Profile sections"
    >
      <ul className="flex flex-wrap items-center justify-center gap-2" role="list">
        {profileSections.map(({ id, label }) => {
          const active = effectiveHash === id;
          return (
            <li key={id}>
              <a
                href={`${PROFILE_BASE}#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = id;
                }}
                className={`${linkBase} ${active ? linkActive : linkInactive}`}
                aria-current={active ? "true" : undefined}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
