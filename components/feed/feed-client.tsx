"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

function UpvoteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 3l5 6H5l5-6z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4.5h14v9H8l-4 3v-3H3v-9z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 4h5v5" />
      <path d="M17 4l-7 7" />
      <path d="M15 11v4.5H4.5V5H9" />
    </svg>
  );
}

type FeedClientProps = {
  initialPostId?: string;
};

export function FeedClient({ initialPostId }: FeedClientProps = {}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedChannelSlug, setSelectedChannelSlug] = useState("all");
  const [feedSort, setFeedSort] = useState<"for_you" | "latest" | "top">("for_you");
  const [currentUserId, setCurrentUserId] = useState("");
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
  const [commentPanels, setCommentPanels] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [submitting, setSubmitting] = useState(false);

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
    const profile = (await profileRes.json()) as { user?: { id: string }; error?: string };
    const usersData = (await usersRes.json()) as { users: SuggestUser[]; error?: string };
    const connectionsData = (await connectionsRes.json()) as { connections: Connection[]; error?: string };
    if (!profileRes.ok || !usersRes.ok || !connectionsRes.ok) {
      throw new Error(profile.error || usersData.error || connectionsData.error || "Failed to load social side panel");
    }

    setCurrentUserId(profile.user?.id || "");
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
  }, [initialPostId, posts.length]);

  async function createPost() {
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      setError("Title and body are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        mediaUrls.push(await uploadFile(file));
      }

      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          body: newPostBody,
          mediaUrls
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to create post");
      setNewPostTitle("");
      setNewPostBody("");
      setMediaFiles([]);
      await loadPosts();
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

  async function toggleComments(postId: string) {
    const nextState = !commentPanels[postId];
    setCommentPanels((prev) => ({ ...prev, [postId]: nextState }));
    if (nextState && !commentsByPost[postId]) {
      try {
        await loadComments(postId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed loading comments");
      }
    }
  }

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
    <div className="page-content space-y-6">
      {loading ? (
        <div className="space-y-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {error && !loading ? (
        <StateMessage variant="error" title="Couldn't load feed" description={error} />
      ) : null}
      {initialPostId ? (
        <div className="card-app-section border-brand-200 bg-brand-50/70 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4h5v5" />
              <path d="M17 4l-7 7" />
              <path d="M15 11v4.5H4.5V5H9" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">You&apos;re viewing a shared post</p>
            <p className="text-xs text-slate-600">Scroll down to see the post highlighted below.</p>
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
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

        <main className="space-y-5">
          <section className="card-app">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200" aria-hidden="true" />
              <div className="w-full space-y-3">
                <label htmlFor="feed-post-title" className="sr-only">Post title</label>
                <input
                  id="feed-post-title"
                  className="input-app min-h-0 rounded-input"
                  placeholder="Post title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  suppressHydrationWarning
                />
                <label htmlFor="feed-post-body" className="sr-only">Post content</label>
                <textarea
                  id="feed-post-body"
                  className="input-app min-h-0 rounded-input resize-y"
                  placeholder="Share something with the community..."
                  rows={4}
                  value={newPostBody}
                  onChange={(e) => setNewPostBody(e.target.value)}
                  suppressHydrationWarning
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <label className="chip-app cursor-pointer text-slate-700 hover:bg-white/90">
                    Add photo/video
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
                    />
                  </label>
                  <Button type="button" onClick={() => void createPost()} disabled={submitting}>
                    {submitting ? "Posting..." : "Post"}
                  </Button>
                </div>
                {mediaFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {mediaFiles.map((file) => {
                      const preview = URL.createObjectURL(file);
                      return file.type.startsWith("video/") ? (
                        <video key={file.name} src={preview} className="h-24 w-full rounded object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={file.name} src={preview} className="h-24 w-full rounded object-cover" alt={file.name} />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="card-app flex flex-wrap items-center justify-between gap-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Community Feed</p>
              <p className="text-xs text-slate-500">Tailored to your interests and connections.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`chip-app transition duration-normal ${
                  feedSort === "for_you" ? "active" : "text-slate-700 hover:bg-white/90"
                }`}
                onClick={() => setFeedSort("for_you")}
              >
                For You
              </button>
              <button
                type="button"
                className={`chip-app transition duration-normal ${
                  feedSort === "latest" ? "active" : "text-slate-700 hover:bg-white/90"
                }`}
                onClick={() => setFeedSort("latest")}
              >
                Latest
              </button>
              <button
                type="button"
                className={`chip-app transition duration-normal ${
                  feedSort === "top" ? "active" : "text-slate-700 hover:bg-white/90"
                }`}
                onClick={() => setFeedSort("top")}
              >
                Top
              </button>
            </div>
          </section>

          {posts.map((post) => (
            <article
              id={`post-${post.id}`}
              key={post.id}
              className={`card-app group transition duration-normal ${
                initialPostId === post.id
                  ? "border-2 border-brand-500 ring-2 ring-brand-500/30 ring-offset-2"
                  : "hover:-translate-y-px"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {initialPostId === post.id ? (
                      <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        Shared post
                      </span>
                    ) : null}
                    <p className="text-base font-semibold text-slate-900">{post.title}</p>
                    {post.channel ? (
                      <Link
                        href={`/channels?slug=${post.channel.slug}`}
                        className="chip-app min-h-0 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-white/90"
                      >
                        /{post.channel.slug}
                      </Link>
                    ) : null}
                  </div>
                  <Link href={`/profile/${post.author.id}`} className="mt-1 block text-xs text-slate-500 transition-colors duration-normal hover:text-brand-600">
                    {post.author.studentProfile?.fullName || post.author.mentorProfile?.fullName || "User"}{" "}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {roleTag(post.author.role)}
                    </span>
                  </Link>
                </div>
                <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700">{post.body}</p>
              {(post.mediaUrls ?? []).length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(post.mediaUrls ?? []).map((url) =>
                    /\.(mp4|webm|mov)$/i.test(url) ? (
                      <video key={url} src={url} controls className="h-48 w-full rounded object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="post media" className="h-48 w-full rounded object-cover" />
                    )
                  )}
                </div>
              ) : null}
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`chip-app inline-flex items-center gap-1.5 transition duration-normal ${
                      post.hasUpvoted
                        ? "active"
                        : "text-slate-700 hover:bg-white/90"
                    }`}
                    onClick={() => void upvotePost(post.id)}
                  >
                    <UpvoteIcon />
                    {post.hasUpvoted ? "Upvoted" : "Upvote"} ({post.upvotes})
                  </button>
                  <button
                    type="button"
                    className="chip-app inline-flex items-center gap-1.5 text-slate-700 transition duration-normal hover:bg-white/90"
                    onClick={() => void toggleComments(post.id)}
                  >
                    <CommentIcon />
                    Comment ({post.commentCount})
                  </button>
                  <button
                    type="button"
                    className="chip-app inline-flex items-center gap-1.5 text-slate-700 transition duration-normal hover:bg-white/90"
                    onClick={() => void sharePost(post.id)}
                  >
                    <ShareIcon />
                    Share ({post.shareCount})
                  </button>
                </div>
              </div>
              {commentPanels[post.id] ? (
                <div className="mt-4 rounded-xl border border-slate-200/50 bg-white/65 p-3.5 backdrop-blur-sm">
                  <div className="space-y-3">
                    {(commentsByPost[post.id] || [])
                      .filter((comment) => !comment.parentId)
                      .map((comment) => {
                        const replies = (commentsByPost[post.id] || []).filter((item) => item.parentId === comment.id);
                        return (
                          <div key={comment.id} className="rounded-md bg-white p-3">
                            <p className="text-xs text-slate-500">
                              {comment.author.studentProfile?.fullName || comment.author.mentorProfile?.fullName || "User"}{" "}
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                {roleTag(comment.author.role)}
                              </span>
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{comment.body}</p>
                            <button
                              type="button"
                              className="mt-2 text-xs font-medium text-brand-700 hover:text-brand-800"
                              onClick={() =>
                                setReplyOpenByComment((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                              }
                            >
                              Reply
                            </button>

                            {replyOpenByComment[comment.id] ? (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  className="input-app min-h-0 rounded-input"
                                  placeholder="Write a reply..."
                                  value={replyDrafts[comment.id] || ""}
                                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                  aria-label="Write a reply"
                                />
                                <Button type="button" variant="secondary" onClick={() => void submitReply(post.id, comment.id)}>
                                  Reply
                                </Button>
                              </div>
                            ) : null}

                            {replies.length > 0 ? (
                              <div className="mt-3 space-y-2 border-l border-slate-200 pl-3">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="rounded-md bg-slate-50 p-2">
                                    <p className="text-xs text-slate-500">
                                      {reply.author.studentProfile?.fullName ||
                                        reply.author.mentorProfile?.fullName ||
                                        "User"}{" "}
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                        {roleTag(reply.author.role)}
                                      </span>
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">{reply.body}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    {(commentsByPost[post.id] || []).filter((comment) => !comment.parentId).length === 0 ? (
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
          ))}
          {!loading && !error && posts.length === 0 ? (
            <StateMessage variant="empty" title="Nothing posted yet" description="Be the first to post and start the conversation." />
          ) : null}
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
