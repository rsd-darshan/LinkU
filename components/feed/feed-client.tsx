"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  _count?: {
    posts: number;
    members: number;
  };
};

type FeedPost = {
  id: string;
  title: string;
  body: string;
  mediaUrls: string[];
  createdAt: string;
  upvotes: number;
  hasUpvoted?: boolean;
  shareCount: number;
  commentCount: number;
  channel: {
    id: string;
    slug: string;
    name: string;
    universityName: string | null;
  } | null;
  author: {
    id: string;
    role: "STUDENT" | "MENTOR" | "ADMIN";
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
  };
};

type FeedComment = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  author: {
    id: string;
    role: "STUDENT" | "MENTOR" | "ADMIN";
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
    imageUrl?: string | null;
  };
};

type SuggestUser = {
  id: string;
  name: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
};

type Connection = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
};

function roleTag(role: "STUDENT" | "MENTOR" | "ADMIN") {
  if (role === "MENTOR") return "Mentor";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

function authorDisplayName(author: FeedPost["author"]) {
  return author.studentProfile?.fullName || author.mentorProfile?.fullName || "User";
}

function initialsFromName(name: string) {
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase() || "?";
}

type FeedClientProps = {
  initialPostId?: string;
};

type ApiFeedPost = Omit<FeedPost, "createdAt"> & { createdAt: string | Date };

function mapApiPostToFeedPost(p: ApiFeedPost): FeedPost {
  return {
    ...p,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
    mediaUrls: Array.isArray(p.mediaUrls) ? p.mediaUrls : [],
    upvotes: typeof p.upvotes === "number" ? p.upvotes : 0,
    shareCount: typeof p.shareCount === "number" ? p.shareCount : 0,
    commentCount: typeof p.commentCount === "number" ? p.commentCount : 0,
    hasUpvoted: Boolean(p.hasUpvoted),
    channel: p.channel ?? null,
    author: p.author
  };
}

export function FeedClient({ initialPostId }: FeedClientProps = {}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedChannelSlug, setSelectedChannelSlug] = useState("all");
  const [feedSort, setFeedSort] = useState<"for_you" | "latest" | "top">("for_you");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserImageUrl, setCurrentUserImageUrl] = useState<string | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenByComment, setReplyOpenByComment] = useState<Record<string, boolean>>({});
  const [commentModalPostId, setCommentModalPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const upvoteInFlight = useRef<Set<string>>(new Set());

  async function loadChannels() {
    const response = await fetch("/api/channels");
    const data = (await response.json()) as { channels: Channel[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load channels");
    setChannels(data.channels || []);
  }

  const feedQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedChannelSlug && selectedChannelSlug !== "all") params.set("channel", selectedChannelSlug);
    params.set("sort", feedSort);
    return params.toString();
  }, [selectedChannelSlug, feedSort]);

  const feedStats = useMemo(() => {
    const totalPosts = posts.length;
    const withChannel = posts.filter((post) => Boolean(post.channel)).length;
    const totalEngagement = posts.reduce((acc, post) => acc + post.upvotes + post.commentCount + post.shareCount, 0);
    const pendingConnections = connections.filter((item) => item.status === "PENDING").length;
    return { totalPosts, withChannel, totalEngagement, pendingConnections };
  }, [posts, connections]);

  const commentModalPost = useMemo(
    () => (commentModalPostId ? posts.find((p) => p.id === commentModalPostId) ?? null : null),
    [commentModalPostId, posts]
  );

  async function loadPosts() {
    const response = await fetch(`/api/feed${feedQuery ? `?${feedQuery}` : ""}`);
    const data = (await response.json()) as { posts: FeedPost[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load posts");
    setPosts(
      (data.posts || []).map((post) => ({
        ...post,
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        hasUpvoted: Boolean(post.hasUpvoted),
        shareCount: typeof post.shareCount === "number" ? post.shareCount : 0,
        commentCount: typeof post.commentCount === "number" ? post.commentCount : 0
      }))
    );
  }

  async function loadUsersAndConnections() {
    const [profileRes, usersRes, connectionsRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/users"),
      fetch("/api/connections")
    ]);
    if (profileRes.status === 401 || usersRes.status === 401 || connectionsRes.status === 401) {
      setCurrentUserId("");
      setSuggestedUsers([]);
      setConnections([]);
      return;
    }
    const profile = (await profileRes.json()) as {
      user?: { id: string };
      studentProfile?: { fullName: string } | null;
      mentorProfile?: { fullName: string } | null;
      imageUrl?: string | null;
      error?: string;
    };
    const usersData = (await usersRes.json()) as { users: SuggestUser[]; error?: string };
    const connectionsData = (await connectionsRes.json()) as { connections: Connection[]; error?: string };
    if (!profileRes.ok || !usersRes.ok || !connectionsRes.ok) {
      throw new Error(profile.error || usersData.error || connectionsData.error || "Failed to load social side panel");
    }

    setCurrentUserId(profile.user?.id || "");
    setCurrentUserImageUrl(profile.imageUrl ?? null);
    setCurrentUserDisplayName(
      profile.studentProfile?.fullName || profile.mentorProfile?.fullName || ""
    );
    setSuggestedUsers((usersData.users || []).slice(0, 8));
    setConnections(connectionsData.connections || []);
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadChannels();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load channels");
      }
      try {
        await loadUsersAndConnections();
      } catch {
        // Non-blocking: side panel stays empty, feed still loads
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    const run = async () => {
      setError(null);
      try {
        await loadPosts();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedQuery, channels.length]);

  useEffect(() => {
    if (initialPostId && posts.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`post-${initialPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPostId, posts.length]);

  useEffect(() => {
    if (!initialPostId || posts.length === 0) return;
    const postExists = posts.some((p) => p.id === initialPostId);
    if (postExists) return;
    fetch(`/api/feed/${initialPostId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.post) {
          const p = data.post;
          setPosts((prev) => [
            {
              id: p.id,
              title: p.title,
              body: p.body,
              mediaUrls: Array.isArray(p.mediaUrls) ? p.mediaUrls : [],
              createdAt: p.createdAt,
              upvotes: p.upvotes ?? 0,
              hasUpvoted: Boolean(p.hasUpvoted),
              shareCount: p.shareCount ?? 0,
              commentCount: p.commentCount ?? 0,
              channel: p.channel,
              author: p.author
            },
            ...prev
          ]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- use posts.length (not posts) to avoid refetch loops when other posts change
  }, [initialPostId, posts.length]);

  async function createPost() {
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      setError("Title and body are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mediaUrls =
        mediaFiles.length > 0 ? await Promise.all(mediaFiles.map((file) => uploadFile(file))) : [];

      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          body: newPostBody,
          mediaUrls
        })
      });
      const data = (await response.json()) as { post?: ApiFeedPost; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error || "Failed to create post");
      const mapped = mapApiPostToFeedPost(data.post);
      setNewPostTitle("");
      setNewPostBody("");
      setMediaFiles([]);
      setPosts((prev) => {
        const without = prev.filter((post) => post.id !== mapped.id);
        return [mapped, ...without];
      });
      void loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadFile(file: File) {
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      const presign = (await presignRes.json()) as {
        uploadUrl?: string;
        publicUrl?: string | null;
        error?: string;
      };
      if (!presignRes.ok || !presign.uploadUrl || !presign.publicUrl) {
        throw new Error(presign.error || "S3 upload unavailable");
      }

      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });
      if (!uploadRes.ok) throw new Error("S3 upload failed");
      return presign.publicUrl;
    } catch {
      const formData = new FormData();
      formData.append("file", file);
      const localRes = await fetch("/api/uploads/local", {
        method: "POST",
        body: formData
      });
      const localData = (await localRes.json()) as { url?: string; error?: string };
      if (!localRes.ok || !localData.url) {
        throw new Error(localData.error || "Upload failed. Check S3 CORS or local upload route.");
      }
      return localData.url;
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
        prev.map((p) =>
          p.id === postId ? { ...p, upvotes: data.post!.upvotes, hasUpvoted: Boolean(data.post?.hasUpvoted) } : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upvote");
    } finally {
      upvoteInFlight.current.delete(postId);
    }
  }

  async function loadComments(postId: string) {
    const response = await fetch(`/api/feed/${postId}/comments`);
    const data = (await response.json()) as { comments?: FeedComment[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed loading comments");
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]:
        data.comments?.map((comment) => ({
          ...comment,
          parentId: comment.parentId || null
        })) || []
    }));
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
    // Intentionally load when the sheet opens for a post id; avoid re-running on every comments map update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentModalPostId]);

  async function submitComment(postId: string) {
    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;
    try {
      const response = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft })
      });
      const data = (await response.json()) as { comment?: FeedComment; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error || "Failed to post comment");

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.comment!]
      }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    }
  }

  async function submitReply(postId: string, parentId: string) {
    const draft = (replyDrafts[parentId] || "").trim();
    if (!draft) return;
    try {
      const response = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft, parentId })
      });
      const data = (await response.json()) as { comment?: FeedComment; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error || "Failed to post reply");

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.comment!]
      }));
      setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
      setReplyOpenByComment((prev) => ({ ...prev, [parentId]: false }));
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
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
      setPosts((prev) =>
        prev.map((post) => (post.id === sharePostId ? { ...post, shareCount: data.post!.shareCount } : post))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share post");
    }
  }

  function connectionStateFor(userId: string) {
    return connections.find(
      (connection) =>
        (connection.requesterId === currentUserId && connection.receiverId === userId) ||
        (connection.receiverId === currentUserId && connection.requesterId === userId)
    );
  }

  async function sendConnectionRequest(receiverId: string) {
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to send request");
      await loadUsersAndConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  return (
    <div className="min-h-0 space-y-4">
      {loading ? (
        <div className="space-y-4 py-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {error && !loading ? (
        <div className="py-2">
          <StateMessage variant="error" title="Couldn't load feed" description={error} />
        </div>
      ) : null}
      {initialPostId ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/15 px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4h5v5" />
              <path d="M17 4l-7 7" />
              <path d="M15 11v4.5H4.5V5H9" />
            </svg>
          </span>
          <div>
            <p className="text-tweet font-bold text-ink">Shared post</p>
            <p className="text-meta text-ink-secondary">Scroll to the highlighted post below.</p>
          </div>
        </div>
      ) : null}
      <div className="min-h-0">
        <aside className="hidden">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Workspace</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                Home Feed
              </Link>
              <Link href="/channels" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                University Channels
              </Link>
              <Link href="/networking" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                Connections
              </Link>
              <Link href="/mentors" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                Mentor Discovery
              </Link>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Channels</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedChannelSlug === "all" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
                onClick={() => setSelectedChannelSlug("all")}
              >
                All
              </button>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selectedChannelSlug === channel.slug ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setSelectedChannelSlug(channel.slug)}
                >
                  {channel.name}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="mx-auto max-w-full space-y-3">
          <section className="rounded-xl border border-line bg-page-subtle p-2 sm:p-2.5">
            <div className="flex items-start gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-secondary text-[11px] font-bold leading-none text-white"
                aria-hidden="true"
              >
                +
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <label
                    htmlFor="feed-post-title"
                    className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary"
                  >
                    Post title
                  </label>
                  <div className="rounded-md border border-line bg-page px-2 py-1.5 shadow-none transition-colors focus-within:border-brand-500/45 focus-within:ring-1 focus-within:ring-brand-500/20">
                    <input
                      id="feed-post-title"
                      className="w-full border-0 bg-transparent p-0 text-body-sm font-semibold leading-snug tracking-tight text-ink placeholder:text-ink-tertiary outline-none focus:ring-0"
                      placeholder="Short headline"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="feed-post-body"
                    className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary"
                  >
                    Post content
                  </label>
                  <div className="rounded-md border border-line bg-page px-2 py-1.5 shadow-none transition-colors focus-within:border-brand-500/45 focus-within:ring-1 focus-within:ring-brand-500/20">
                    <textarea
                      id="feed-post-body"
                      className="min-h-[3.25rem] w-full resize-y border-0 bg-transparent p-0 text-body-sm font-normal leading-snug text-ink placeholder:text-ink-secondary outline-none focus:ring-0"
                      placeholder="What’s happening?"
                      rows={3}
                      value={newPostBody}
                      onChange={(e) => setNewPostBody(e.target.value)}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-line/90 pt-2">
                  <label className="focus-ring inline-flex h-7 cursor-pointer items-center gap-1 rounded border border-line/90 bg-page px-2 py-0 text-[11px] font-semibold text-brand-600 transition hover:border-brand-500/35 hover:bg-page-subtle hover:text-brand-700">
                    Media
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
                    />
                  </label>
                  <Button
                    type="button"
                    className="!min-h-7 h-7 min-w-0 rounded-md px-3 py-0 text-[11px] font-semibold"
                    onClick={() => void createPost()}
                    disabled={submitting}
                  >
                    {submitting ? "Posting..." : "Post"}
                  </Button>
                </div>
                {mediaFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {mediaFiles.map((file) => {
                      const preview = URL.createObjectURL(file);
                      return file.type.startsWith("video/") ? (
                        <video key={file.name} src={preview} className="h-16 w-full rounded-lg object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={file.name} src={preview} className="h-16 w-full rounded-lg object-cover" alt={file.name} />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <nav
            className="flex gap-1 rounded-xl border border-line bg-page-subtle p-1"
            aria-label="Feed sort"
          >
            {(["for_you", "latest", "top"] as const).map((key) => {
              const label = key === "for_you" ? "For you" : key === "latest" ? "Latest" : "Top";
              const active = feedSort === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`focus-ring relative flex h-8 min-h-0 flex-1 items-center justify-center rounded-md px-2 text-caption font-semibold transition ${
                    active
                      ? "border border-brand-500/50 bg-brand-600 text-white"
                      : "border border-transparent bg-page text-ink-secondary hover:border-line hover:bg-page-subtle hover:text-ink"
                  }`}
                  onClick={() => setFeedSort(key)}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-3">
          {posts.map((post) => {
            const displayName = authorDisplayName(post.author);
            const initials = initialsFromName(displayName);
            return (
              <article
                id={`post-${post.id}`}
                key={post.id}
                className={`rounded-2xl border border-line bg-page p-4 shadow-sm transition-shadow duration-fast ease-smooth sm:p-5 ${
                  initialPostId === post.id
                    ? "ring-2 ring-brand-200 ring-offset-2 ring-offset-page"
                    : "hover:shadow-md"
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  <Link href={`/profile/${post.author.id}`} className="focus-ring h-fit shrink-0 rounded-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-page-subtle text-body-sm font-bold text-ink ring-1 ring-line">
                      {initials}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/profile/${post.author.id}`} className="truncate text-tweet font-bold text-ink hover:underline">
                        {displayName}
                      </Link>
                      <span className="text-meta font-normal text-ink-secondary">· {roleTag(post.author.role)} · </span>
                      <time className="text-meta text-ink-secondary" dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </time>
                      {post.channel ? (
                        <Link
                          href={`/channels?slug=${post.channel.slug}`}
                          className="text-meta font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          /{post.channel.slug}
                        </Link>
                      ) : null}
                      {initialPostId === post.id ? (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Shared
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-1.5 border-b border-line/70 pb-2 text-title-sm font-bold tracking-tight text-ink">
                      {post.title}
                    </h2>
                    <p className="mt-2.5 whitespace-pre-wrap text-tweet font-normal leading-relaxed text-ink">
                      {post.body}
                    </p>
                    {(post.mediaUrls ?? []).length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 gap-2 overflow-hidden rounded-xl border border-line/80 sm:grid-cols-2">
                        {(post.mediaUrls ?? []).map((url) =>
                          /\.(mp4|webm|mov)$/i.test(url) ? (
                            <video key={url} src={url} controls className="max-h-80 w-full bg-black object-contain" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={url} src={url} alt="" className="max-h-80 w-full object-cover" />
                          )
                        )}
                      </div>
                    ) : null}
                    <div className="mt-4 w-full max-w-xl border-t border-line/60 pt-3">
                      <PostActionBar
                        upvotes={post.upvotes}
                        commentCount={post.commentCount}
                        shareCount={post.shareCount}
                        hasUpvoted={Boolean(post.hasUpvoted)}
                        commentsPanelOpen={commentModalPostId === post.id}
                        onUpvote={() => void upvotePost(post.id)}
                        onToggleComments={() => void toggleComments(post.id)}
                        onShare={() => void sharePost(post.id)}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!loading && !error && posts.length === 0 ? (
            <div className="p-6">
              <StateMessage
                variant="empty"
                title="Nothing posted yet"
                description="Be the first to post and start the conversation."
              />
            </div>
          ) : null}
          </div>
        </main>

        <aside className="hidden">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Community Health</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Posts</p>
                <p className="text-base font-semibold text-slate-900">{feedStats.totalPosts}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Channel Posts</p>
                <p className="text-base font-semibold text-slate-900">{feedStats.withChannel}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Engagement</p>
                <p className="text-base font-semibold text-slate-900">{feedStats.totalEngagement}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Pending Links</p>
                <p className="text-base font-semibold text-slate-900">{feedStats.pendingConnections}</p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:hidden">
            <h3 className="text-sm font-semibold text-slate-900">Channels</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedChannelSlug === "all" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
                onClick={() => setSelectedChannelSlug("all")}
              >
                All
              </button>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selectedChannelSlug === channel.slug ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setSelectedChannelSlug(channel.slug)}
                >
                  {channel.name}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">People</h3>
            <div className="mt-3 space-y-2">
              {suggestedUsers.map((user) => {
                const existing = connectionStateFor(user.id);
                return (
                  <div key={user.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{roleTag(user.role)}</p>
                    <div className="mt-2">
                      {!existing ? (
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          onClick={() => void sendConnectionRequest(user.id)}
                        >
                          Connect
                        </button>
                      ) : existing.status === "ACCEPTED" ? (
                        <span className="text-xs text-emerald-700">Connected</span>
                      ) : (
                        <span className="text-xs text-amber-700">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
      {commentModalPost ? (
        <CommentsModal
          open
          onClose={() => setCommentModalPostId(null)}
          postId={commentModalPost.id}
          postTitle={commentModalPost.title}
          comments={commentsByPost[commentModalPost.id] || []}
          variant="threaded"
          commentDraft={commentDrafts[commentModalPost.id] || ""}
          onCommentDraftChange={(value) =>
            setCommentDrafts((prev) => ({ ...prev, [commentModalPost.id]: value }))
          }
          onSubmitComment={() => void submitComment(commentModalPost.id)}
          currentUserImageUrl={currentUserImageUrl}
          currentUserDisplayName={currentUserDisplayName}
          replyDrafts={replyDrafts}
          replyOpenByComment={replyOpenByComment}
          onToggleReply={(commentId) =>
            setReplyOpenByComment((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
          }
          onReplyDraftChange={(commentId, value) =>
            setReplyDrafts((prev) => ({ ...prev, [commentId]: value }))
          }
          onSubmitReply={(parentId) => void submitReply(commentModalPost.id, parentId)}
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
