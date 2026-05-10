"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ShareModalProps = {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
};

type Connection = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  requester: {
    id: string;
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
  };
  receiver: {
    id: string;
    studentProfile: { fullName: string } | null;
    mentorProfile: { fullName: string } | null;
  };
};

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 4h5v5" />
      <path d="M17 4l-7 7" />
      <path d="M15 11v4.5H4.5V5H9" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3M8 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 0h2a2 2 0 0 1 2 2v2m-6 0h6" />
    </svg>
  );
}

export function ShareModal({ postId, postTitle, isOpen, onClose, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [sharingToConnections, setSharingToConnections] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${postId}` : "";

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data: { user?: { id: string } }) => {
          setCurrentUserId(data.user?.id || "");
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showConnections && currentUserId) {
      fetch("/api/connections")
        .then((res) => res.json())
        .then((data: { connections: Connection[] }) => {
          const accepted = (data.connections || []).filter((c) => c.status === "ACCEPTED");
          setConnections(accepted);
        })
        .catch(() => {});
    }
  }, [isOpen, showConnections, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare();
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      onShare();
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: postTitle || "LinkU Post",
          text: postTitle || "Check out this post on LinkU",
          url: shareUrl
        });
        onShare();
      }
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(postTitle || "Check out this post on LinkU");
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
    onShare();
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
    onShare();
  };

  const handleShareToConnections = async () => {
    if (selectedConnections.size === 0) return;
    setSharingToConnections(true);
    try {
      const response = await fetch(`/api/feed/${postId}/share-to-connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionIds: Array.from(selectedConnections) })
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Failed to share");
      onShare();
      setSelectedConnections(new Set());
      setShowConnections(false);
    } catch (err) {
      console.error("Failed to share to connections:", err);
    } finally {
      setSharingToConnections(false);
    }
  };

  const toggleConnection = (connectionId: string) => {
    setSelectedConnections((prev) => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const getConnectionName = (connection: Connection, currentUserId?: string) => {
    const otherUser = connection.requesterId === currentUserId ? connection.receiver : connection.requester;
    return otherUser.studentProfile?.fullName || otherUser.mentorProfile?.fullName || "User";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white/88 shadow-xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/70 p-4">
          <h2 id="share-modal-title" className="text-lg font-semibold text-slate-900">Share Post</h2>
          <p className="mt-1 text-xs text-slate-500">Send to your network or copy a direct link.</p>
        </div>
        <div className="p-4">
          <div className="mb-4 rounded-lg border border-white/80 bg-white/70 p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent text-sm text-slate-600 outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowConnections(!showConnections)}
            className="focus-ring mb-3 flex w-full items-center justify-between rounded-lg border border-brand-400/70 bg-brand-50/75 px-4 py-3 text-sm font-medium text-brand-700 transition duration-normal hover:bg-brand-100/80"
            aria-expanded={showConnections}
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Share to Connections
            </span>
            <span className="text-xs text-brand-600">
              {selectedConnections.size > 0 ? `${selectedConnections.size} selected` : ""}
            </span>
          </button>

          {showConnections && (
            <div className="mb-4 max-h-52 space-y-2 overflow-y-auto rounded-lg border border-white/80 bg-white/68 p-3">
              {connections.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300/80 bg-white/75 px-3 py-3 text-center text-sm text-slate-600">
                  No connections yet. <Link href="/networking" className="text-brand-600 hover:underline">Find people</Link>
                </p>
              ) : (
                connections.map((connection) => {
                  const name = getConnectionName(connection, currentUserId);
                  const isSelected = selectedConnections.has(connection.id);
                  return (
                    <label
                      key={connection.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition duration-normal ${
                        isSelected ? "border-brand-500 bg-brand-50/80" : "border-white/80 bg-white/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleConnection(connection.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="flex-1 text-sm text-slate-700">{name}</span>
                    </label>
                  );
                })
              )}
              {connections.length > 0 && selectedConnections.size > 0 && (
                <Button
                  type="button"
                  onClick={handleShareToConnections}
                  disabled={sharingToConnections}
                  className="mt-2 w-full"
                >
                  {sharingToConnections ? "Sharing..." : `Share to ${selectedConnections.size} connection${selectedConnections.size > 1 ? "s" : ""}`}
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition duration-normal hover:bg-white"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy Link
                </>
              )}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition duration-normal hover:bg-white"
              >
                <LinkIcon />
                Share...
              </button>
            )}
            <button
              type="button"
              onClick={handleTwitterShare}
              className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition duration-normal hover:bg-white"
            >
              <TwitterIcon />
              Twitter
            </button>
            <button
              type="button"
              onClick={handleFacebookShare}
              className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition duration-normal hover:bg-white"
            >
              <FacebookIcon />
              Facebook
            </button>
          </div>
        </div>
        <div className="border-t border-white/70 p-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
