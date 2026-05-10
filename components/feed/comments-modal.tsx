"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type CommentModalAuthor = {
  id: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  studentProfile: { fullName: string } | null;
  mentorProfile: { fullName: string } | null;
  imageUrl?: string | null;
};

export type CommentModalEntry = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  author: CommentModalAuthor;
};

function roleTag(role: "STUDENT" | "MENTOR" | "ADMIN") {
  if (role === "MENTOR") return "Mentor";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

function displayName(author: CommentModalAuthor) {
  return author.studentProfile?.fullName || author.mentorProfile?.fullName || "User";
}

function initialsFromName(name: string) {
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase() || "?";
}

function AuthorAvatar({
  author,
  size = "md"
}: {
  author: CommentModalAuthor;
  size?: "sm" | "md";
}) {
  const name = displayName(author);
  const initials = initialsFromName(name);
  const dim = size === "md" ? "h-10 w-10 text-body-sm" : "h-8 w-8 text-caption";
  const inner =
    author.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={author.imageUrl} alt="" className={`${dim} rounded-full object-cover ring-1 ring-line`} />
    ) : (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-page-subtle font-bold text-ink ring-1 ring-line ${dim}`}
      >
        {initials}
      </div>
    );

  return (
    <Link href={`/profile/${author.id}`} className="focus-ring shrink-0 rounded-full" title={name}>
      {inner}
    </Link>
  );
}

type CommentsModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  comments: CommentModalEntry[];
  variant: "threaded" | "flat";
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: () => void;
  currentUserImageUrl?: string | null;
  currentUserDisplayName?: string;
  replyDrafts?: Record<string, string>;
  replyOpenByComment?: Record<string, boolean>;
  onToggleReply?: (commentId: string) => void;
  onReplyDraftChange?: (commentId: string, value: string) => void;
  onSubmitReply?: (parentId: string) => void;
};

export function CommentsModal({
  open,
  onClose,
  postId,
  postTitle,
  comments,
  variant,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  currentUserImageUrl,
  currentUserDisplayName = "",
  replyDrafts = {},
  replyOpenByComment = {},
  onToggleReply,
  onReplyDraftChange,
  onSubmitReply
}: CommentsModalProps) {
  const titleId = "comments-modal-title";
  const composerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => composerRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, postId]);

  if (!open) return null;

  const meInitials = initialsFromName(currentUserDisplayName || "You");
  const meAvatar =
    currentUserImageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentUserImageUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line"
      />
    ) : (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-page-subtle text-caption font-bold text-ink ring-1 ring-line">
        {meInitials}
      </div>
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Close comments"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-in relative z-10 flex max-h-[min(86dvh,calc(100dvh-1.5rem))] w-full max-w-2xl flex-col rounded-2xl border border-line bg-page shadow-2xl"
        style={{ paddingTop: "max(0rem, env(safe-area-inset-top, 0px))" }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 pb-3 pt-1">
          <div className="min-w-0">
            <h2 id={titleId} className="text-title-sm font-bold tracking-tight text-ink">
              Comments
            </h2>
            <p className="mt-0.5 line-clamp-2 text-meta text-ink-secondary">{postTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary transition hover:bg-line hover:text-ink"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
          {variant === "flat" ? (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <AuthorAvatar author={comment.author} />
                  <div className="min-w-0 flex-1">
                    <p className="text-meta text-ink-secondary">
                      <span className="font-bold text-ink">{displayName(comment.author)}</span>
                      <span className="text-ink-secondary"> · {roleTag(comment.author.role)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-body-sm leading-relaxed text-ink">{comment.body}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 ? (
                <p className="py-6 text-center text-meta text-ink-secondary">No comments yet. Start the thread.</p>
              ) : null}
            </ul>
          ) : (
            <div className="space-y-4">
              {comments
                .filter((c) => !c.parentId)
                .map((comment) => {
                  const replies = comments.filter((item) => item.parentId === comment.id);
                  return (
                    <div key={comment.id} className="border-b border-line pb-4 last:border-0">
                      <div className="flex gap-3">
                        <AuthorAvatar author={comment.author} />
                        <div className="min-w-0 flex-1">
                          <p className="text-meta text-ink-secondary">
                            <span className="font-bold text-ink">{displayName(comment.author)}</span>
                            <span className="text-ink-secondary"> · {roleTag(comment.author.role)}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-body-sm leading-relaxed text-ink">{comment.body}</p>
                          {onToggleReply ? (
                            <button
                              type="button"
                              className="focus-ring mt-2 text-meta font-bold text-brand-600 hover:text-brand-700 hover:underline"
                              onClick={() => onToggleReply(comment.id)}
                            >
                              Post
                            </button>
                          ) : null}

                          {replyOpenByComment[comment.id] && onReplyDraftChange && onSubmitReply ? (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="hidden shrink-0 sm:block">{meAvatar}</div>
                              <input
                                className="input-app min-h-0 flex-1"
                                placeholder="Write a message..."
                                value={replyDrafts[comment.id] || ""}
                                onChange={(e) => onReplyDraftChange(comment.id, e.target.value)}
                                aria-label="Write a message"
                              />
                              <Button type="button" variant="secondary" onClick={() => onSubmitReply(comment.id)}>
                                Post
                              </Button>
                            </div>
                          ) : null}

                          {replies.length > 0 ? (
                            <ul className="mt-3 space-y-3 border-l-2 border-line pl-3">
                              {replies.map((reply) => (
                                <li key={reply.id} className="flex gap-2">
                                  <AuthorAvatar author={reply.author} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-meta text-ink-secondary">
                                      <span className="font-bold text-ink">{displayName(reply.author)}</span>
                                      <span className="text-ink-secondary"> · {roleTag(reply.author.role)}</span>
                                    </p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-body-sm text-ink">{reply.body}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {comments.filter((c) => !c.parentId).length === 0 ? (
                <p className="py-6 text-center text-meta text-ink-secondary">No comments yet. Start the conversation.</p>
              ) : null}
            </div>
          )}
        </div>

        <footer
          className="shrink-0 border-t border-line bg-page px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-2">
            {meAvatar}
            <input
              ref={composerRef}
              className="input-app min-h-0 flex-1"
              placeholder={variant === "threaded" ? "Write your comment..." : "Write a comment..."}
              value={commentDraft}
              onChange={(e) => onCommentDraftChange(e.target.value)}
              aria-label="Write a comment"
            />
            <Button type="button" variant="secondary" onClick={onSubmitComment}>
              Post
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
