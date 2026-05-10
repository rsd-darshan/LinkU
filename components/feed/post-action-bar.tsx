"use client";

function UpvoteGlyph({ active }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-[18px] shrink-0"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 3l5 6H5l5-6z" />
    </svg>
  );
}

function CommentGlyph() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4.5h14v9H8l-4 3v-3H3v-9z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 4h5v5" />
      <path d="M17 4l-7 7" />
      <path d="M15 11v4.5H4.5V5H9" />
    </svg>
  );
}

export type PostActionBarProps = {
  upvotes: number;
  commentCount: number;
  shareCount: number;
  hasUpvoted: boolean;
  commentsPanelOpen?: boolean;
  onUpvote: () => void;
  onToggleComments: () => void;
  onShare: () => void;
};

export function PostActionBar({
  upvotes,
  commentCount,
  shareCount,
  hasUpvoted,
  commentsPanelOpen,
  onUpvote,
  onToggleComments,
  onShare
}: PostActionBarProps) {
  const commentActive = Boolean(commentsPanelOpen);

  return (
    <div role="group" aria-label="Post actions" className="flex flex-wrap items-center gap-2 sm:gap-3">
      <button
        type="button"
        aria-pressed={hasUpvoted}
        title={hasUpvoted ? "Remove upvote" : "Upvote"}
        onClick={onUpvote}
        className={`focus-ring inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-meta font-semibold tabular-nums tracking-tight transition duration-fast ease-smooth ${
          hasUpvoted
            ? "text-ink bg-ink/[0.07] hover:bg-ink/[0.1] active:bg-ink/[0.12]"
            : "text-ink-secondary hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100/80"
        }`}
      >
        <UpvoteGlyph active={hasUpvoted} />
        <span>{upvotes}</span>
        {hasUpvoted ? <span className="sr-only">You upvoted this post. Activate to remove your upvote.</span> : null}
      </button>
      <button
        type="button"
        aria-pressed={commentActive}
        title="View comments"
        onClick={onToggleComments}
        className={`focus-ring inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-meta font-semibold tabular-nums tracking-tight transition duration-fast ease-smooth ${
          commentActive
            ? "text-ink bg-line hover:bg-line/90"
            : "text-ink-secondary hover:bg-line hover:text-ink"
        }`}
      >
        <CommentGlyph />
        <span>{commentCount}</span>
      </button>
      <button
        type="button"
        title="Share post"
        onClick={onShare}
        className="focus-ring inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-meta font-semibold tabular-nums tracking-tight text-ink-secondary transition duration-fast ease-smooth hover:bg-line hover:text-ink active:bg-line/80"
      >
        <ShareGlyph />
        <span>{shareCount}</span>
      </button>
    </div>
  );
}
