"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AgoraVideoCall = dynamic(() => import("./agora-video-call").then((m) => ({ default: m.AgoraVideoCall })), {
  ssr: false
});

type Invite = { from: string; fromName: string; channelName: string };

type AgoraCallContextValue = {
  startVideoCall: (receiverId: string, receiverName: string) => Promise<void>;
};

const AgoraCallContext = createContext<AgoraCallContextValue | null>(null);

export function useAgoraCall() {
  const ctx = useContext(AgoraCallContext);
  if (!ctx) throw new Error("useAgoraCall must be used within AgoraCallProvider");
  return ctx;
}

export function AgoraCallProvider({ children }: { children: React.ReactNode }) {
  const [incomingInvite, setIncomingInvite] = useState<Invite | null>(null);
  const [activeCall, setActiveCall] = useState<{ channelName: string; remoteName: string } | null>(null);
  const [declinedMessage, setDeclinedMessage] = useState<string | null>(null);

  const startVideoCall = useCallback(async (receiverId: string, receiverName: string) => {
    const res = await fetch("/api/calls/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: receiverId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start call");
    setActiveCall({ channelName: data.channelName, remoteName: receiverName });
  }, []);

  useEffect(() => {
    if (!activeCall) return;
    let mounted = true;
    const pollStatus = async () => {
      if (!mounted || !activeCall) return;
      try {
        const res = await fetch(
          `/api/calls/invite?channelName=${encodeURIComponent(activeCall.channelName)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.status === "declined" && data.declinedByName) {
          setDeclinedMessage(`Declined by ${data.declinedByName}`);
          setActiveCall(null);
        }
      } catch {
        // Ignore
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeCall?.channelName]);

  useEffect(() => {
    if (!declinedMessage) return;
    const t = setTimeout(() => setDeclinedMessage(null), 4000);
    return () => clearTimeout(t);
  }, [declinedMessage]);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      if (!mounted) return;
      try {
        const res = await fetch("/api/calls/invite", { credentials: "include" });
        const data = await res.json();
        if (data.invites?.length > 0 && !activeCall && !incomingInvite) {
          setIncomingInvite(data.invites[0]);
        }
      } catch {
        // Ignore
      }
    };
    const interval = setInterval(poll, 1500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeCall, incomingInvite]);

  const handleAnswer = () => {
    if (incomingInvite) {
      setActiveCall({
        channelName: incomingInvite.channelName,
        remoteName: incomingInvite.fromName
      });
      setIncomingInvite(null);
    }
  };

  const handleReject = async () => {
    if (incomingInvite) {
      try {
        await fetch(`/api/calls/invite?channelName=${encodeURIComponent(incomingInvite.channelName)}`, {
          method: "DELETE"
        });
      } catch {
        // Ignore
      }
      setIncomingInvite(null);
    }
  };

  const handleLeave = () => {
    setActiveCall(null);
  };

  return (
    <AgoraCallContext.Provider value={{ startVideoCall }}>
      {children}
      {declinedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="mx-auto max-w-sm rounded-2xl bg-white px-8 py-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-900">{declinedMessage}</p>
            <p className="mt-2 text-sm text-gray-500">Returning to chat...</p>
          </div>
        </div>
      )}
      {incomingInvite && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
          <div className="mx-4 max-w-sm rounded-2xl bg-white p-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-3xl font-bold text-white">
              {incomingInvite.fromName?.charAt(0).toUpperCase()}
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">{incomingInvite.fromName}</h2>
            <p className="mb-6 text-lg text-gray-600">Incoming video call</p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleReject}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                title="Decline"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleAnswer}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
                title="Answer"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {activeCall && (
        <AgoraVideoCall
          channelName={activeCall.channelName}
          remoteName={activeCall.remoteName}
          onLeave={handleLeave}
        />
      )}
    </AgoraCallContext.Provider>
  );
}
