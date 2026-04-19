"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatWindow } from "@/components/messages/chat-window";
import { useAgoraCall } from "@/components/calls/agora-call-provider";
import { StateMessage } from "@/components/ui/state-message";

type ThreadOption = {
  id: string;
  type: "direct";
  label: string;
  receiverId: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  hasUnreadFromOther?: boolean;
};

type MessageRow = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function MessagesClient() {
  return <MessagesContent />;
}

function MessagesContent() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [threads, setThreads] = useState<ThreadOption[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [threadOpenedAt, setThreadOpenedAt] = useState<Record<string, string>>({});
  const { startVideoCall } = useAgoraCall();

  const hydrateThreadActivity = useCallback(
    async (rawThreads: ThreadOption[], userId: string) => {
      const enriched = await Promise.all(
        rawThreads.map(async (thread) => {
          try {
            const res = await fetch(`/api/messages?userId=${thread.receiverId}`);
            const data = (await res.json()) as { messages?: MessageRow[] };
            const list = data.messages || [];
            const last = list[list.length - 1];
            if (!last) return thread;
            return {
              ...thread,
              lastMessageAt: last.createdAt,
              lastMessagePreview: last.body,
              hasUnreadFromOther: last.senderId !== userId
            };
          } catch {
            return thread;
          }
        })
      );

      return enriched.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
    },
    []
  );

  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, threadsRes] = await Promise.all([fetch("/api/profile"), fetch("/api/messages/threads")]);
        const profile = (await profileRes.json()) as { user?: { id: string }; error?: string };
        const threadsData = (await threadsRes.json()) as {
          acceptedConnections: Array<{
            id: string;
            requesterId: string;
            receiverId: string;
            requester: { id: string; studentProfile: { fullName: string } | null };
            receiver: { id: string; studentProfile: { fullName: string } | null };
          }>;
          error?: string;
        };

        if (profile.error || !profile.user?.id) {
          throw new Error(profile.error || "User profile not found");
        }

        setCurrentUserId(profile.user.id);

        const formattedThreads: ThreadOption[] = threadsData.acceptedConnections.map((conn) => {
          const isRequester = conn.requesterId === profile.user!.id;
          const otherUser = isRequester ? conn.receiver : conn.requester;
          const fullName = otherUser.studentProfile?.fullName || "Unknown User";
          return {
            id: conn.id,
            type: "direct",
            label: fullName,
            receiverId: otherUser.id
          };
        });

        const hydrated = await hydrateThreadActivity(formattedThreads, profile.user.id);
        setThreads(hydrated);
        if (hydrated.length > 0) {
          setSelectedThreadId(hydrated[0].id);
          setThreadOpenedAt((prev) => ({ ...prev, [hydrated[0].id]: new Date().toISOString() }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [hydrateThreadActivity]);

  const selectedThread = useMemo(() => threads.find((t) => t.id === selectedThreadId), [selectedThreadId, threads]);
  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter((t) => t.label.toLowerCase().includes(q));
  }, [search, threads]);

  const loadMessages = useCallback(async () => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/messages?userId=${selectedThread.receiverId}`);
      const data = (await res.json()) as { messages: MessageRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      const nextMessages = data.messages || [];
      setMessages(nextMessages);
      setThreads((prev) =>
        prev
          .map((thread) => {
            if (thread.id !== selectedThread.id) return thread;
            const last = nextMessages[nextMessages.length - 1];
            if (!last) return thread;
            const openedAt = threadOpenedAt[thread.id];
            const unreadFromOther = Boolean(
              openedAt && last.senderId !== currentUserId && new Date(last.createdAt).getTime() > new Date(openedAt).getTime()
            );
            return {
              ...thread,
              lastMessageAt: last.createdAt,
              lastMessagePreview: last.body,
              hasUnreadFromOther: unreadFromOther
            };
          })
          .sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return tb - ta;
          })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  }, [selectedThread, threadOpenedAt, currentUserId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedThread) return;
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadMessages();
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedThread, loadMessages]);

  async function sendMessage(body: string) {
    if (!selectedThread) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedThread.receiverId, body })
    });
    const data = (await res.json()) as { message?: MessageRow; error?: string };
    if (!res.ok || !data.message) throw new Error(data.error || "Failed to send");
    const nextMessage = data.message as MessageRow;
    setMessages((prev) => [...prev, nextMessage]);
    setThreads((prev) =>
      prev
        .map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                lastMessageAt: nextMessage.createdAt,
                lastMessagePreview: nextMessage.body,
                hasUnreadFromOther: false
              }
            : thread
        )
        .sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        })
    );
    setThreadOpenedAt((prev) =>
      selectedThread ? { ...prev, [selectedThread.id]: new Date().toISOString() } : prev
    );
  }

  const handleVideoCall = useCallback(async () => {
    if (!selectedThread?.receiverId) return;
    setIsStartingCall(true);
    try {
      await startVideoCall(selectedThread.receiverId, selectedThread.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
    } finally {
      setIsStartingCall(false);
    }
  }, [selectedThread, startVideoCall]);

  if (loading) {
    return (
      <div className="chat-container">
        <aside className="chat-sidebar !w-[320px] !rounded-none !border-r !border-l-0 !border-t-0 !border-b-0">
          <div className="shrink-0 border-b border-slate-200 p-3">
            <h1 className="text-title-sm font-semibold text-slate-900">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </aside>
        <div className="flex flex-1 items-center justify-center bg-transparent">
          <p className="text-body-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !threads.length) {
    return (
      <div className="flex h-full min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 p-6">
        <StateMessage variant="error" title="Couldn't load conversations" description={error} />
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Left: conversation list — messenger-style, scrolls independently */}
      <aside
        className="chat-sidebar !w-[320px] !rounded-none !border-r !border-l-0 !border-t-0 !border-b-0"
        aria-label="Conversations"
      >
        <div className="shrink-0 border-b border-slate-200 p-3">
          <h1 className="text-title-sm font-semibold text-slate-900">Messages</h1>
          <label htmlFor="messages-search" className="sr-only">Search conversations</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              id="messages-search"
              type="search"
              placeholder="Search"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-body-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-4">
              <StateMessage
                variant="empty"
                title="No conversations"
                description="Accept a connection request to start chatting."
                className="border-0 bg-transparent p-0 text-left"
              />
            </div>
          ) : (
            <ul className="py-1">
              {filteredThreads.map((thread) => {
                const isSelected = selectedThreadId === thread.id;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        setThreadOpenedAt((prev) => ({ ...prev, [thread.id]: new Date().toISOString() }));
                      }}
                      aria-pressed={isSelected}
                      className={`thread-item w-full text-left ${isSelected ? "active" : ""}`}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white"
                        aria-hidden
                      >
                        {thread.label.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-body-sm ${isSelected ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                          {thread.label}
                        </span>
                        <span className={`block truncate text-caption ${thread.hasUnreadFromOther ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                          {thread.lastMessagePreview || "No messages yet"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Right: chat area — fills remaining space, scrolls independently */}
      <div className="chat-content !ml-0 !rounded-none !border-0">
        <ChatWindow
          header={
            selectedThread
              ? {
                  avatarLetter: selectedThread.label.charAt(0).toUpperCase(),
                  name: selectedThread.label,
                  onVideoCall: handleVideoCall,
                  isCallDisabled: isStartingCall
                }
              : undefined
          }
          messages={messages.map((msg) => ({
            id: msg.id,
            authorLabel: msg.senderId === currentUserId ? "You" : selectedThread?.label ?? "Them",
            body: msg.body,
            createdAt: new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }),
            isOwnMessage: msg.senderId === currentUserId
          }))}
          newMessagesStartIndex={
            selectedThread
              ? messages.findIndex(
                  (msg) =>
                    msg.senderId !== currentUserId &&
                    Boolean(threadOpenedAt[selectedThread.id]) &&
                    new Date(msg.createdAt).getTime() > new Date(threadOpenedAt[selectedThread.id]).getTime()
                )
              : -1
          }
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
