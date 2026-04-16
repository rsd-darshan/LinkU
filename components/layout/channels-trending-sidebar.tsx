"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type TrendingPost = {
  id: string;
  title: string;
  body: string;
  upvotes?: number;
  mediaUrls?: string[];
  createdAt: string;
  channel: {
    slug: string;
    name: string;
  };
};

const TOPIC_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "you",
  "your",
  "from",
  "have",
  "just",
  "about",
  "into",
  "when",
  "what",
  "will",
  "would",
  "there",
  "their",
  "they",
  "been",
  "were",
  "where",
  "which",
  "while",
  "post",
  "channel",
  "channels",
  "linku"
]);

function trendScore(post: TrendingPost) {
  const hoursSinceCreated = Math.max(1, ((typeof window !== 'undefined' ? Date.now() : 0) - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
  const recencyWeight = 24 / hoursSinceCreated;
  const mediaWeight = (post.mediaUrls?.length || 0) > 0 ? 2 : 0;
  const upvoteWeight = (post.upvotes || 0) * 3;
  return upvoteWeight + recencyWeight + mediaWeight;
}

export function ChannelsTrendingSidebar() {
  const searchParams = useSearchParams();
  const selectedSlug = useMemo(() => searchParams?.get("slug") || "", [searchParams]);
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 5);
  }, [posts]);

  const hotTopics = useMemo(() => {
    const scores = new Map<string, number>();
    for (const post of posts) {
      const combined = `${post.title} ${post.body}`.toLowerCase();
      const words = combined.match(/[a-z0-9]{3,}/g) || [];
      const uniqueWords = new Set(
        words.filter((word) => !TOPIC_STOP_WORDS.has(word) && !word.startsWith("http") && Number.isNaN(Number(word)))
      );
      for (const word of uniqueWords) {
        scores.set(word, (scores.get(word) || 0) + trendScore(post));
      }
    }
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [posts]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        if (selectedSlug) {
          const response = await fetch(`/api/channels/${selectedSlug}/posts`);
          const data = (await response.json()) as {
            posts?: Array<Omit<TrendingPost, "channel"> & { channel?: TrendingPost["channel"] }>;
            channel?: TrendingPost["channel"];
            error?: string;
          };
          if (!response.ok) throw new Error(data.error || "Failed to load trending channel posts");
          const channel = data.channel || { slug: selectedSlug, name: selectedSlug };
          setPosts(
            (data.posts || []).map((post) => ({
              ...post,
              upvotes: typeof post.upvotes === "number" ? post.upvotes : 0,
              mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
              channel: post.channel || channel
            }))
          );
          return;
        }

        const response = await fetch("/api/feed");
        const data = (await response.json()) as {
          posts?: Array<
            Omit<TrendingPost, "channel"> & {
              channel: TrendingPost["channel"] | null;
            }
          >;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "Failed to load trending feed posts");
        setPosts(
          (data.posts || [])
            .filter((post) => post.channel)
            .map((post) => ({
              ...post,
              upvotes: typeof post.upvotes === "number" ? post.upvotes : 0,
              mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
              channel: post.channel as TrendingPost["channel"]
            }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sidebar");
      }
    };
    void load();
  }, [selectedSlug]);

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-14 space-y-4">
        {selectedSlug ? (
          <section className="card-app p-4">
            <h3 className="text-title-sm text-slate-900">Most trending in /{selectedSlug}</h3>
            <div className="mt-3 space-y-2">
              {trendingPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/channels?slug=${post.channel.slug}`}
                  className="block rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
                >
                  <p className="text-[11px] text-slate-500">#{idx + 1} in /{post.channel.slug}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{post.title}</p>
                  <p className="mt-1 text-xs text-slate-500">Score {Math.round(trendScore(post))} · ▲ {post.upvotes || 0}</p>
                </Link>
              ))}
              {trendingPosts.length === 0 ? <p className="text-xs text-slate-500">No trending posts yet.</p> : null}
            </div>
          </section>
        ) : (
          <section className="card-app p-4">
            <h3 className="text-title-sm text-slate-900">Hot Topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {hotTopics.map(([topic, score]) => (
                <span
                  key={topic}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                  title={`Topic score ${Math.round(score)}`}
                >
                  #{topic}
                </span>
              ))}
              {hotTopics.length === 0 ? <p className="text-xs text-slate-500">No hot topics yet.</p> : null}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-700">Trending across channels</p>
              <div className="mt-2 space-y-2">
                {trendingPosts.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    href={`/channels?slug=${post.channel.slug}`}
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span className="font-medium">/{post.channel.slug}</span> · {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </aside>
  );
}
