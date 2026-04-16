"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShareModal } from "./share-modal";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";
import { CardSkeleton } from "@/components/ui/skeleton";

type Channel = {
  id: string;
  name: string;
  slug: string;
  universityName: string | null;
  description: string | null;
  _count?: { posts: number; members: number };
};

type ChannelPost = {
  id: string;
  title: string;
  body: string;
  mediaUrls?: string[];
  upvotes?: number;
  hasUpvoted?: boolean;
  createdAt: string;
  channel: {
    id: string;
    slug: string;
    name: string;
    universityName: string | null;
  };
  author: {
    role: "STUDENT" | "MENTOR" | "ADMIN";
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
  };
};

type ChannelComment = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: {
    role: "STUDENT" | "MENTOR" | "ADMIN";
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
  };
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12 6 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 11a8 8 0 1 0 2 5.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function UpvoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 5-6 7h4v7h4v-7h4l-6-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h16v10H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M8 11 16 6M8 13l8 5" strokeLinecap="round" />
    </svg>
  );
}

function roleTag(role: "STUDENT" | "MENTOR" | "ADMIN") {
  if (role === "MENTOR") return "Mentor";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

export function ChannelsClient() {
  const searchParams = useSearchParams();
  const requestedSlug = useMemo(() => searchParams?.get("slug") || "", [searchParams]);
  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [suggestedChannels, setSuggestedChannels] = useState<Channel[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"new" | "top">("new");
  const [search, setSearch] = useState("");
  const [commentPanels, setCommentPanels] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, ChannelComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [shareCountByPost, setShareCountByPost] = useState<Record<string, number>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedChannel = useMemo(
    () => joinedChannels.find((channel) => channel.slug === selectedSlug) || null,
    [joinedChannels, selectedSlug]
  );
  const selectedSuggestedChannel = useMemo(
    () => suggestedChannels.find((channel) => channel.slug === selectedSlug) || null,
    [suggestedChannels, selectedSlug]
  );
  const isSelectedJoined = useMemo(() => joinedChannels.some((channel) => channel.slug === selectedSlug), [joinedChannels, selectedSlug]);

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (sortMode === "top") {
      return copy.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, sortMode]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedPosts;

    return sortedPosts.filter((post) => {
      const authorName = (
        post.author.studentProfile?.fullName ||
        post.author.mentorProfile?.fullName ||
        "user"
      ).toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.body.toLowerCase().includes(query) ||
        post.channel.slug.toLowerCase().includes(query) ||
        post.channel.name.toLowerCase().includes(query) ||
        authorName.includes(query)
      );
    });
  }, [search, sortedPosts]);

  async function loadMembership() {
    const response = await fetch("/api/channels/membership");
    const data = (await response.json()) as { joined: Channel[]; suggested: Channel[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load channels");
    setJoinedChannels(data.joined || []);
    setSuggestedChannels(data.suggested || []);

    const combined = [...(data.joined || []), ...(data.suggested || [])];
    if (requestedSlug && combined.some((channel) => channel.slug === requestedSlug)) {
      setSelectedSlug(requestedSlug);
    }
  }

  async function loadPosts(slug: string) {
    if (slug && !joinedChannels.some((channel) => channel.slug === slug)) {
      setPosts([]);
      return;
    }

    if (slug) {
      const response = await fetch(`/api/channels/${slug}/posts`);
      const data = (await response.json()) as {
        posts: Array<Omit<ChannelPost, "channel"> & { channel?: ChannelPost["channel"] }>;
        channel?: ChannelPost["channel"];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Failed to load channel posts");
      const channel = data.channel;
      setPosts(
        (data.posts || []).map((post) => ({
          ...post,
          mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
          hasUpvoted: Boolean(post.hasUpvoted),
          channel: post.channel || channel || { id: "", slug, name: selectedChannel?.name || slug, universityName: null }
        }))
      );
      return;
    }

    const response = await fetch("/api/feed");
    const data = (await response.json()) as {
      posts: Array<{
        id: string;
        title: string;
        body: string;
        mediaUrls?: string[];
        upvotes?: number;
        hasUpvoted?: boolean;
        createdAt: string;
        channel: ChannelPost["channel"] | null;
        author: ChannelPost["author"];
      }>;
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Failed to load channel network feed");
    setPosts(
      (data.posts || [])
        .filter((post) => post.channel)
        .map((post) => ({
          id: post.id,
          title: post.title,
          body: post.body,
          mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
          upvotes: typeof post.upvotes === "number" ? post.upvotes : 0,
          hasUpvoted: Boolean(post.hasUpvoted),
          createdAt: post.createdAt,
          channel: post.channel as ChannelPost["channel"],
          author: post.author
        }))
    );
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadMembership();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize channels");
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        await loadPosts(selectedSlug);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load channel feed");
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug]);

  async function joinChannel(channelId: string, slug: string) {
    setJoiningChannelId(channelId);
    setError(null);
    try {
      const response = await fetch("/api/channels/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to join channel");
      await loadMembership();
      setSelectedSlug(slug);
      await loadPosts(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join channel");
    } finally {
      setJoiningChannelId(null);
    }
  }

  async function upvotePost(postId: string) {
    try {
      const response = await fetch(`/api/feed/${postId}/upvote`, { method: "POST" });
      const data = (await response.json()) as { post?: { id: string; upvotes: number; hasUpvoted?: boolean }; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error || "Failed to upvote");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, upvotes: data.post!.upvotes, hasUpvoted: Boolean(data.post?.hasUpvoted) }
            : post
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upvote");
    }
  }

  async function sharePost(postId: string) {
    setSharePostId(postId);
    setShareModalOpen(true);
  }

  async function handleShareConfirm() {
    if (!sharePostId) return;
    try {
      const response = await fetch(`/api/feed/${sharePostId}/share`, { method: "POST" });
      const data = (await response.json()) as { post?: { id: string; shareCount: number }; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error || "Failed to share");
      setShareCountByPost((prev) => ({ ...prev, [sharePostId]: data.post!.shareCount }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share post");
    }
  }

  async function loadComments(postId: string) {
    const response = await fetch(`/api/feed/${postId}/comments`);
    const data = (await response.json()) as { comments?: ChannelComment[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed loading comments");
    setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
  }

  async function toggleComments(postId: string) {
    const open = !commentPanels[postId];
    setCommentPanels((prev) => ({ ...prev, [postId]: open }));
    if (open && !commentsByPost[postId]) {
      try {
        await loadComments(postId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed loading comments");
      }
    }
  }

  async function submitComment(postId: string) {
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;
    try {
      const response = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      const data = (await response.json()) as { comment?: ChannelComment; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error || "Failed to comment");
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment!] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to comment");
    }
  }

  return (
    <div className="page-content space-y-5">
      {error ? (
        <StateMessage variant="error" title="Something went wrong" description={error} />
      ) : null}
      {loading && !error ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      {!loading ? (
      <>
      <section className="card-app">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Channel Workspace</p>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                {selectedChannel ? `/${selectedChannel.slug}` : "All channel posts"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/channels/new"
                className="chip-app inline-flex items-center gap-1.5 text-slate-700 hover:bg-white/90"
                title="Create channel"
                aria-label="Create channel"
              >
                <PlusIcon />
                <span>Channel</span>
              </Link>
              <Link
                href={selectedSlug ? `/channels/post?slug=${selectedSlug}` : "/channels/post"}
                className="chip-app inline-flex items-center gap-1.5 text-slate-700 hover:bg-white/90"
                title="Create post"
                aria-label="Create post"
              >
                <EditIcon />
                <span>Post</span>
              </Link>
              <Link
                href="/channels"
                className="chip-app inline-flex items-center gap-1.5 text-slate-700 hover:bg-white/90"
                title="Refresh feed"
                aria-label="Refresh feed"
              >
                <RefreshIcon />
                <span>Refresh</span>
              </Link>
            </div>
          </div>

          <div className="relative w-full lg:max-w-3xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              className="input-app min-h-0 rounded-pill border-slate-300 py-3 pl-8 pr-3"
              placeholder="Search posts, channels, or authors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search posts, channels, or authors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`chip-app chip-filter-channel transition ${
                !selectedSlug
                  ? "active"
                  : "text-slate-700"
              }`}
              onClick={() => setSelectedSlug("")}
            >
              All channels
            </button>
            {joinedChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={`chip-app chip-filter-channel transition ${
                  selectedSlug === channel.slug
                    ? "active"
                    : "text-slate-700"
                }`}
                onClick={() => setSelectedSlug(channel.slug)}
              >
                /{channel.slug}
              </button>
            ))}
          </div>

          {suggestedChannels.length > 0 ? (
            <div className="rounded-xl border border-slate-200/50 bg-white/60 p-3 backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-700">Discover channels to join first</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedChannels.slice(0, 6).map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    className="chip-app text-slate-700 transition hover:bg-white/90"
                    onClick={() => void joinChannel(channel.id, channel.slug)}
                    disabled={joiningChannelId === channel.id}
                  >
                    {joiningChannelId === channel.id ? "Joining..." : `Join /${channel.slug}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6">
        <main className="mx-auto w-full max-w-6xl space-y-5">
          {selectedSlug && !isSelectedJoined ? (
            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-amber-900">
                Join /{selectedSuggestedChannel?.slug || selectedSlug} to view this channel feed
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Reddit-style flow: join first, then you can browse and post in this community.
              </p>
              {selectedSuggestedChannel ? (
                <button
                  type="button"
                  className="mt-3 chip-app border-amber-300 text-amber-800 hover:bg-amber-100/70"
                  onClick={() => void joinChannel(selectedSuggestedChannel.id, selectedSuggestedChannel.slug)}
                  disabled={joiningChannelId === selectedSuggestedChannel.id}
                >
                  {joiningChannelId === selectedSuggestedChannel.id ? "Joining..." : `Join /${selectedSuggestedChannel.slug}`}
                </button>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="card-app flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                {selectedChannel ? `/${selectedChannel.slug} feed` : "Recent posts across channels"}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`chip-app ${
                    sortMode === "new" ? "active" : "text-slate-700"
                  }`}
                  onClick={() => setSortMode("new")}
                >
                  New
                </button>
                <button
                  type="button"
                  className={`chip-app ${
                    sortMode === "top" ? "active" : "text-slate-700"
                  }`}
                  onClick={() => setSortMode("top")}
                >
                  Top
                </button>
                <p className="text-xs text-slate-500">{visiblePosts.length} posts</p>
              </div>
            </div>
            {isSelectedJoined || !selectedSlug ? visiblePosts.map((post) => (
              <article key={post.id} className="card-app">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900">{post.title}</p>
                      <Link
                        href={`/channels?slug=${post.channel.slug}`}
                        className="chip-app min-h-0 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-white/90"
                      >
                        /{post.channel.slug}
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {post.author.studentProfile?.fullName || post.author.mentorProfile?.fullName || "User"}{" "}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {roleTag(post.author.role)}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{post.body}</p>
                {(post.mediaUrls ?? []).length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(post.mediaUrls ?? []).map((url) =>
                      /\.(mp4|webm|mov)$/i.test(url) ? (
                        <video key={url} src={url} controls className="h-56 w-full rounded-xl object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="channel post media" className="h-56 w-full rounded-xl object-cover" />
                      )
                    )}
                  </div>
                ) : null}
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        post.hasUpvoted
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => void upvotePost(post.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <UpvoteIcon />
                        <span>{post.hasUpvoted ? "Upvoted" : "Upvote"} ({post.upvotes || 0})</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={() => void toggleComments(post.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <CommentIcon />
                        <span>Comment ({commentsByPost[post.id]?.length || 0})</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={() => void sharePost(post.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <ShareIcon />
                        <span>Share ({shareCountByPost[post.id] || 0})</span>
                      </span>
                    </button>
                  </div>
                </div>
                {commentPanels[post.id] ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="space-y-2">
                      {(commentsByPost[post.id] || []).map((comment) => (
                        <div key={comment.id} className="rounded-md bg-white p-2">
                          <p className="text-xs text-slate-500">
                            {comment.author.studentProfile?.fullName || comment.author.mentorProfile?.fullName || "User"}{" "}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                              {roleTag(comment.author.role)}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{comment.body}</p>
                        </div>
                      ))}
                      {(commentsByPost[post.id] || []).length === 0 ? (
                        <p className="text-xs text-slate-500">No comments yet.</p>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        className="input-app min-h-0 flex-1 rounded-input"
                        placeholder="Write a comment..."
                        value={commentDrafts[post.id] || ""}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        aria-label="Write a comment"
                      />
                      <Button type="button" variant="secondary" onClick={() => void submitComment(post.id)}>
                        Send
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            )) : null}
            {((isSelectedJoined || !selectedSlug) && visiblePosts.length === 0) ? (
              <StateMessage
                variant="empty"
                title={search.trim() ? "No matching posts" : "No channel posts yet"}
                description={search.trim() ? "Try a different search term." : "Join a channel and post, or create a new channel."}
              />
            ) : null}
          </section>
        </main>
      </div>
      </>
      ) : null}
      {sharePostId && (
        <ShareModal
          postId={sharePostId}
          postTitle={posts.find((p) => p.id === sharePostId)?.title || ""}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSharePostId(null);
          }}
          onShare={handleShareConfirm}
        />
      )}
    </div>
  );
}
