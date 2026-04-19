"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CommentsModal } from "./comments-modal";
import { PostActionBar } from "./post-action-bar";
import { ShareModal } from "./share-modal";
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
    id: string;
    role: "STUDENT" | "MENTOR" | "ADMIN";
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
    imageUrl?: string | null;
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
  const [commentModalPostId, setCommentModalPostId] = useState<string | null>(null);
  const [currentUserImageUrl, setCurrentUserImageUrl] = useState<string | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<Record<string, ChannelComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [shareCountByPost, setShareCountByPost] = useState<Record<string, number>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const upvoteInFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    void fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            studentProfile?: { fullName: string } | null;
            mentorProfile?: { fullName: string } | null;
            imageUrl?: string | null;
          } | null
        ) => {
          if (!data) return;
          setCurrentUserImageUrl(data.imageUrl ?? null);
          setCurrentUserDisplayName(
            data.studentProfile?.fullName || data.mentorProfile?.fullName || ""
          );
        }
      )
      .catch(() => {});
  }, []);

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

  const commentModalPost = useMemo(
    () => (commentModalPostId ? posts.find((p) => p.id === commentModalPostId) ?? null : null),
    [commentModalPostId, posts]
  );

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
    if (upvoteInFlight.current.has(postId)) return;
    upvoteInFlight.current.add(postId);
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
    } finally {
      upvoteInFlight.current.delete(postId);
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

  function toggleComments(postId: string) {
    setCommentModalPostId((prev) => (prev === postId ? null : postId));
  }

  useEffect(() => {
    const id = commentModalPostId;
    if (!id) return;
    if (commentsByPost[id] !== undefined) return;
    void loadComments(id).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed loading comments")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentModalPostId]);

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
    <div className="page-content space-y-6">
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
      <section
        aria-labelledby="channel-workspace-heading"
        className="rounded-2xl border border-line bg-page p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                id="channel-workspace-heading"
                className="text-caption font-semibold uppercase tracking-wide text-ink-tertiary"
              >
                Channel workspace
              </p>
              <h2 className="mt-1 text-title font-bold tracking-tight text-ink">
                {selectedChannel ? `/${selectedChannel.slug}` : "All channel posts"}
              </h2>
              {selectedChannel?.description ? (
                <p className="mt-1.5 max-w-2xl text-body-sm text-ink-secondary">{selectedChannel.description}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/channels/new"
                className="chip-app inline-flex items-center gap-1.5 text-ink-secondary hover:bg-page-subtle"
                title="Create channel"
                aria-label="Create channel"
              >
                <PlusIcon />
                <span>Channel</span>
              </Link>
              <Link
                href={selectedSlug ? `/channels/post?slug=${selectedSlug}` : "/channels/post"}
                className="chip-app inline-flex items-center gap-1.5 text-ink-secondary hover:bg-page-subtle"
                title="Create post"
                aria-label="Create post"
              >
                <EditIcon />
                <span>Post</span>
              </Link>
              <Link
                href="/channels"
                className="chip-app inline-flex items-center gap-1.5 text-ink-secondary hover:bg-page-subtle"
                title="Refresh feed"
                aria-label="Refresh feed"
              >
                <RefreshIcon />
                <span>Refresh</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-page-subtle p-4 sm:p-5" aria-label="Search posts in channels">
        <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Find in feed</p>
        <div className="relative w-full lg:max-w-3xl">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-tertiary"
            aria-hidden="true"
          >
            <SearchIcon />
          </span>
          <input
            type="search"
            className="focus-ring min-h-[44px] w-full rounded-full border border-line bg-page py-2.5 pl-11 pr-4 text-body-sm text-ink outline-none transition placeholder:text-ink-secondary hover:bg-page-subtle focus:border-brand-500 focus:bg-page focus:ring-1 focus:ring-brand-500"
            placeholder="Search posts, channels, or authors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search posts, channels, or authors"
            autoComplete="off"
          />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-page p-4 shadow-sm sm:p-5" aria-label="Pick a channel">
        <p className="mb-3 text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Switch channel</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`chip-app chip-filter-channel transition ${
              !selectedSlug ? "active" : "text-ink-secondary"
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
                selectedSlug === channel.slug ? "active" : "text-ink-secondary"
              }`}
              onClick={() => setSelectedSlug(channel.slug)}
            >
              /{channel.slug}
            </button>
          ))}
        </div>

        {suggestedChannels.length > 0 ? (
          <>
            <div className="my-5 flex items-center gap-3" role="separator" aria-hidden="true">
              <span className="h-px min-w-[2rem] flex-1 bg-line" />
              <span className="shrink-0 text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
                Suggested to join
              </span>
              <span className="h-px min-w-[2rem] flex-1 bg-line" />
            </div>
            <div className="rounded-lg border border-dashed border-line bg-page-subtle/80 p-3 sm:p-4">
              <p className="text-body-sm text-ink-secondary">Browse communities you are not in yet — join to read and post.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedChannels.slice(0, 6).map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    className="chip-app text-ink-secondary transition hover:bg-page"
                    onClick={() => void joinChannel(channel.id, channel.slug)}
                    disabled={joiningChannelId === channel.id}
                  >
                    {joiningChannelId === channel.id ? "Joining..." : `Join /${channel.slug}`}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <div className="space-y-6">
        {selectedSlug && !isSelectedJoined ? (
          <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/90 p-4 shadow-sm sm:p-5">
            <p className="text-caption font-semibold uppercase tracking-wide text-amber-900/90">Membership required</p>
            <h3 className="mt-1 text-title-sm font-bold text-amber-950">
              Join /{selectedSuggestedChannel?.slug || selectedSlug} to view this feed
            </h3>
            <p className="mt-2 text-body-sm text-amber-900/85">
              Join the channel first, then you can browse posts and publish in this community.
            </p>
            {selectedSuggestedChannel ? (
              <button
                type="button"
                className="btn-app-secondary mt-4 border-amber-300 bg-page text-amber-950 hover:bg-amber-100/80"
                onClick={() => void joinChannel(selectedSuggestedChannel.id, selectedSuggestedChannel.slug)}
                disabled={joiningChannelId === selectedSuggestedChannel.id}
              >
                {joiningChannelId === selectedSuggestedChannel.id ? "Joining..." : `Join /${selectedSuggestedChannel.slug}`}
              </button>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4" aria-label="Channel posts">
          <div className="rounded-2xl border border-line bg-page px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Posts</p>
                <h2 className="mt-0.5 text-title-sm font-bold text-ink">
                  {selectedChannel ? `/${selectedChannel.slug}` : "All channels"} — feed
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`chip-app ${sortMode === "new" ? "active" : "text-ink-secondary"}`}
                  onClick={() => setSortMode("new")}
                >
                  New
                </button>
                <button
                  type="button"
                  className={`chip-app ${sortMode === "top" ? "active" : "text-ink-secondary"}`}
                  onClick={() => setSortMode("top")}
                >
                  Top
                </button>
                <span className="rounded-full bg-page-subtle px-2.5 py-1 text-caption font-semibold text-ink-secondary">
                  {visiblePosts.length} posts
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isSelectedJoined || !selectedSlug ? visiblePosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-line bg-page p-4 shadow-sm transition-shadow duration-fast ease-smooth hover:shadow-md sm:p-5"
              >
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
                <div className="mt-4 w-full border-t border-line/70 pt-3">
                  <PostActionBar
                    upvotes={post.upvotes || 0}
                    commentCount={commentsByPost[post.id]?.length || 0}
                    shareCount={shareCountByPost[post.id] || 0}
                    hasUpvoted={Boolean(post.hasUpvoted)}
                    commentsPanelOpen={commentModalPostId === post.id}
                    onUpvote={() => void upvotePost(post.id)}
                    onToggleComments={() => void toggleComments(post.id)}
                    onShare={() => void sharePost(post.id)}
                  />
                </div>
              </article>
            )) : null}
          </div>
            {isSelectedJoined || !selectedSlug ? (
              visiblePosts.length === 0 ? (
                <StateMessage
                  variant="empty"
                  title={search.trim() ? "No matching posts" : "No channel posts yet"}
                  description={
                    search.trim()
                      ? "Try a different search term."
                      : "Join a channel and post, or create a new channel."
                  }
                />
              ) : null
            ) : null}
        </section>
      </div>
      </>
      ) : null}
      {commentModalPost ? (
        <CommentsModal
          open
          onClose={() => setCommentModalPostId(null)}
          postId={commentModalPost.id}
          postTitle={commentModalPost.title}
          comments={commentsByPost[commentModalPost.id] || []}
          variant="flat"
          commentDraft={commentDrafts[commentModalPost.id] || ""}
          onCommentDraftChange={(value) =>
            setCommentDrafts((prev) => ({ ...prev, [commentModalPost.id]: value }))
          }
          onSubmitComment={() => void submitComment(commentModalPost.id)}
          currentUserImageUrl={currentUserImageUrl}
          currentUserDisplayName={currentUserDisplayName}
        />
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
