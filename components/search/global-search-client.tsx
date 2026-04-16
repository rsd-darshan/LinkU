"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StateMessage } from "@/components/ui/state-message";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type SearchPerson = {
  id: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  name: string;
};

type SearchChannel = {
  id: string;
  name: string;
  slug: string;
  universityName: string | null;
  description: string | null;
  _count?: { posts: number; members: number };
};

type SearchPost = {
  id: string;
  title: string;
  body: string;
  upvotes?: number;
  mediaUrls?: string[];
  commentCount?: number;
  hasUpvoted?: boolean;
  channel: {
    slug: string;
    name: string;
    universityName?: string | null;
  } | null;
  author: {
    id: string;
    role: string;
    studentProfile: { fullName: string | null } | null;
    mentorProfile: { fullName: string | null } | null;
  };
};

type Props = {
  query: string;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1.5-3.3 4.5-5 8-5s6.5 1.7 8 5" strokeLinecap="round" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m3 9 9-4 9 4-9 4-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" strokeLinecap="round" />
    </svg>
  );
}

export function GlobalSearchClient({ query }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<SearchPerson[]>([]);
  const [channels, setChannels] = useState<SearchChannel[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(query);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPeople([]);
      setChannels([]);
      setPosts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as {
        people?: SearchPerson[];
        posts?: SearchPost[];
        channels?: SearchChannel[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Search failed");
      setPeople(data.people ?? []);
      setPosts(data.posts ?? []);
      setChannels(data.channels ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setPeople([]);
      setChannels([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocalQuery(query);
    void runSearch(query);
  }, [query, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = localQuery.trim();
    if (!q) return;
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("q", q);
    router.push(`/search?${next.toString()}`);
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = people.length > 0 || posts.length > 0 || channels.length > 0;

  return (
    <div className="page-content space-y-6">
      {/* Page search bar — prominent and synced with URL */}
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Refine search"
        className="card-app"
      >
        <label htmlFor="search-page-input" className="sr-only">
          Search people, posts, and channels
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <SearchIcon />
            </span>
            <input
              id="search-page-input"
              type="search"
              placeholder="Search people, posts & channels…"
              className="input-app min-h-[48px] w-full rounded-card pl-12 pr-4 text-body"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              aria-describedby="search-hint"
            />
          </div>
          <Button type="submit" className="btn-app-primary shrink-0">
            Search
          </Button>
        </div>
        <p id="search-hint" className="mt-2 text-caption text-slate-500">
          Find mentors, students, posts, and channels by name or keyword.
        </p>
      </form>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <StateMessage variant="error" title="Search failed" description={error} />
      ) : !hasQuery ? (
        <div className="card-app py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <SearchIcon />
          </div>
          <h2 className="mt-4 text-title-sm text-slate-900">Search LinkU</h2>
          <p className="mt-2 max-w-sm mx-auto text-body-sm text-slate-600">
            Use the search bar above to find people (mentors and students), posts, and channels.
          </p>
        </div>
      ) : !hasResults ? (
        <StateMessage
          variant="empty"
          title="No results"
          description={`Nothing matched "${query.trim()}". Try a different term or check spelling.`}
        />
      ) : (
        <>
          {/* Summary pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1.5 text-caption font-medium text-brand-700">
              People: {people.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-caption text-slate-700">
              Posts: {posts.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-caption text-slate-700">
              Channels: {channels.length}
            </span>
          </div>

          {/* People — first, with role badges and profile links */}
          <section className="card-app" aria-labelledby="people-heading">
            <h2 id="people-heading" className="text-title-sm text-slate-900">
              People
            </h2>
            <p className="mt-1 text-caption text-slate-500">
              Mentors and students matching your search
            </p>
            <ul className="mt-4 space-y-2">
              {people.length === 0 ? (
                <li className="text-body-sm text-slate-500">No matching people.</li>
              ) : (
                people.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/profile/${person.id}`}
                      className="focus-ring flex items-center gap-3 rounded-input border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{person.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            person.role === "MENTOR"
                              ? "bg-amber-100 text-amber-800"
                              : person.role === "STUDENT"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {person.role === "MENTOR" && <GraduationIcon />}
                          {person.role}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Posts */}
          <section className="card-app" aria-labelledby="posts-heading">
            <h2 id="posts-heading" className="text-title-sm text-slate-900">
              Posts
            </h2>
            <p className="mt-1 text-caption text-slate-500">
              {posts.length} post{posts.length !== 1 ? "s" : ""} found
            </p>
            <div className="mt-4 space-y-3">
              {posts.length === 0 ? (
                <p className="text-body-sm text-slate-500">No matching posts.</p>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="focus-ring block rounded-card border border-slate-200 bg-white p-4 transition hover:shadow-card-hover"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body font-semibold text-slate-900">{post.title}</span>
                      {post.channel && (
                        <Link
                          href={`/channels?slug=${post.channel.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100"
                        >
                          /{post.channel.slug}
                        </Link>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-body-sm text-slate-600">{post.body}</p>
                    {(post.mediaUrls ?? []).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(post.mediaUrls ?? []).slice(0, 3).map((url) =>
                          /\.(mp4|webm|mov)$/i.test(url) ? (
                            <video key={url} src={url} className="h-24 w-full rounded object-cover" muted playsInline />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={url} src={url} alt="" className="h-24 w-full rounded object-cover" />
                          )
                        )}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Channels */}
          <section className="card-app" aria-labelledby="channels-heading">
            <h2 id="channels-heading" className="text-title-sm text-slate-900">
              Channels
            </h2>
            <p className="mt-1 text-caption text-slate-500">
              {channels.length} channel{channels.length !== 1 ? "s" : ""} found
            </p>
            <ul className="mt-4 space-y-2">
              {channels.length === 0 ? (
                <li className="text-body-sm text-slate-500">No matching channels.</li>
              ) : (
                channels.map((channel) => (
                  <li key={channel.id}>
                    <Link
                      href={`/channels?slug=${channel.slug}`}
                      className="focus-ring block rounded-input px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">/{channel.slug}</span>
                      <span className="ml-2 text-body-sm text-slate-500">— {channel.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
