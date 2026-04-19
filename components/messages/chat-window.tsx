"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

export type ChatMessage = {
  id: string;
  authorLabel: string;
  body: string;
  createdAt: string;
  isOwnMessage: boolean;
};

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (body: string) => void;
  newMessagesStartIndex?: number;
  header?: {
    avatarLetter: string;
    name: string;
    onVideoCall?: () => void;
    isCallDisabled?: boolean;
  };
}

function VideoCallIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

const SCROLL_STICKY_THRESHOLD = 100;

export function ChatWindow({ messages, onSend, newMessagesStartIndex = -1, header }: ChatWindowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight <= SCROLL_STICKY_THRESHOLD;
  }, []);

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;
    const lastIsOwn = messages[messages.length - 1]?.isOwnMessage;
    const shouldStick = isNearBottomRef.current || lastIsOwn;
    if (!shouldStick) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = inputRef.current?.value?.trim();
    if (!body) return;
    onSend(body);
    inputRef.current!.value = "";
  }

  const showPlaceholder = !header;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      {header ? (
        <header className="chat-header gap-3 bg-transparent px-4 py-3 shadow-none">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white"
            aria-hidden
          >
            {header.avatarLetter}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-body font-semibold text-slate-900">{header.name}</h2>
            <p className="text-caption text-slate-500">Active on LinkU</p>
          </div>
          {header.onVideoCall && (
            <button
              type="button"
              onClick={header.onVideoCall}
              disabled={header.isCallDisabled}
              className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50 disabled:pointer-events-none"
              title="Start video call"
              aria-label="Start video call"
            >
              <VideoCallIcon />
            </button>
          )}
        </header>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-messages"
      >
        {showPlaceholder ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-slate-200 p-6 text-slate-400">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.864 9.864 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mt-4 text-body font-medium text-slate-700">Your messages</p>
            <p className="mt-1 text-body-sm text-slate-500">Select a conversation or start a new one from Connections.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-body-sm text-slate-500">No messages yet.</p>
            <p className="mt-1 text-caption text-slate-400">Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                {idx === newMessagesStartIndex ? (
                  <div className="my-2 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                    <span className="text-caption font-semibold uppercase tracking-wide text-brand-700">New messages</span>
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  </div>
                ) : null}
                <div className={`flex ${msg.isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.isOwnMessage
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                    }`}
                  >
                    <p className={`mb-0.5 text-caption font-medium ${msg.isOwnMessage ? "text-brand-100" : "text-slate-500"}`}>
                      {msg.authorLabel}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-body-sm">{msg.body}</p>
                    <p className={`mt-1 text-caption ${msg.isOwnMessage ? "text-brand-200" : "text-slate-400"}`}>
                      {msg.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {header && (
        <form onSubmit={handleSubmit} className="chat-input-container">
          <div className="flex w-full gap-2">
            <label htmlFor="chat-message-input" className="sr-only">Type a message</label>
            <input
              ref={inputRef}
              id="chat-message-input"
              type="text"
              placeholder="Type a message…"
              className="chat-input min-h-[44px] flex-1 px-4 py-2.5 text-body-sm text-slate-900"
              autoComplete="off"
            />
            <Button type="submit" className="btn-app-primary shrink-0 rounded-full px-5">
              Send
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
