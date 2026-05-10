"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useRemoteUsers,
  LocalUser,
  useRTCClient,
  useClientEvent,
  useConnectionState
} from "agora-rtc-react";
import type { IMicrophoneAudioTrack, ICameraVideoTrack, IAgoraRTCRemoteUser } from "agora-rtc-react";

interface AgoraVideoCallInnerProps {
  channelName: string;
  remoteName: string;
  onLeave: () => void;
}

function AgoraVideoCallInner({ channelName, remoteName, onLeave }: AgoraVideoCallInnerProps) {
  const client = useRTCClient();
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [publishPhase, setPublishPhase] = useState<"idle" | "creating" | "ready" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [remoteEndedMessage, setRemoteEndedMessage] = useState<string | null>(null);
  const tracksCreatedRef = useRef(false);
  const mediaCancelledRef = useRef(false);
  const remoteAudioTrackIdsPlayedRef = useRef<Set<string>>(new Set());
  const tracksRef = useRef<{ video: ICameraVideoTrack | null; audio: IMicrophoneAudioTrack | null }>({
    video: null,
    audio: null
  });
  tracksRef.current.video = localVideoTrack;
  tracksRef.current.audio = localAudioTrack;

  const fetchToken = useMemo(
    () => async () => {
      const res = await fetch("/api/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get token");
      return {
        appid: data.appId,
        channel: data.channelName,
        token: data.token,
        uid: data.uid
      };
    },
    [channelName]
  );

  const { isLoading: joinLoading, isConnected } = useJoin(fetchToken, true);
  const connectionState = useConnectionState(client);
  const remoteUsers = useRemoteUsers();

  const playRemoteVideo = useCallback((user: { uid: string | number; videoTrack?: { play: (id: string) => void } }) => {
    if (!user.videoTrack) return;
    const containerId = `remote-video-${user.uid}`;
    const tryPlay = () => {
      try {
        const el = document.getElementById(containerId);
        if (el) user.videoTrack!.play(containerId);
      } catch {
        // ignore
      }
    };
    tryPlay();
    requestAnimationFrame(tryPlay);
    [80, 150, 300, 500, 800, 1200, 2000].forEach((ms) => setTimeout(tryPlay, ms));
  }, []);

  useClientEvent(
    client,
    "user-published",
    useCallback(
      async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        try {
          if (client?.connectionState !== "CONNECTED") return;
          await client.subscribe(user, mediaType);
          await new Promise((r) => setTimeout(r, 80));
          if (mediaType === "video" && user.videoTrack) playRemoteVideo(user);
          if (mediaType === "audio" && user.audioTrack) {
            const track = user.audioTrack as { getTrackId?: () => string; isPlaying?: boolean };
            const trackId = track.getTrackId?.() ?? `uid-${user.uid}-audio`;
            const alreadyPlayed = remoteAudioTrackIdsPlayedRef.current.has(trackId);
            const alreadyPlaying = track.isPlaying === true;
            if (!alreadyPlayed && !alreadyPlaying) {
              remoteAudioTrackIdsPlayedRef.current.add(trackId);
              user.audioTrack.play();
            }
          }
        } catch (e) {
          console.warn("Subscribe failed:", e);
        }
      },
      [client, playRemoteVideo]
    )
  );

  useClientEvent(
    client,
    "user-left",
    useCallback(() => {
      setRemoteEndedMessage(`${remoteName} ended the call`);
    }, [remoteName])
  );

  useEffect(() => {
    if (!remoteEndedMessage) return;
    const t = setTimeout(() => onLeave(), 2500);
    return () => clearTimeout(t);
  }, [remoteEndedMessage, onLeave]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) playRemoteVideo(user);
      // Fallback: play remote audio if we have the track and haven't played it yet (e.g. user-published raced)
      if (user.audioTrack) {
        const track = user.audioTrack as { getTrackId?: () => string; isPlaying?: boolean };
        const trackId = track.getTrackId?.() ?? `uid-${user.uid}-audio`;
        if (!remoteAudioTrackIdsPlayedRef.current.has(trackId) && !track.isPlaying) {
          remoteAudioTrackIdsPlayedRef.current.add(trackId);
          user.audioTrack.play();
        }
      }
    });
  }, [remoteUsers, playRemoteVideo]);

  useEffect(() => {
    return () => {
      mediaCancelledRef.current = true;
    };
  }, []);

  const startMedia = useCallback(async () => {
    if (!client || !isConnected || tracksCreatedRef.current) return;
    tracksCreatedRef.current = true;
    mediaCancelledRef.current = false;
    setPublishPhase("creating");

    let videoTrack: ICameraVideoTrack | null = null;
    let audioTrack: IMicrophoneAudioTrack | null = null;

    const cancelled = () => mediaCancelledRef.current;

    try {
      const [videoResult, audioResult] = await Promise.allSettled([
        AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_2" }),
        AgoraRTC.createMicrophoneAudioTrack({ AEC: true, AGC: true, ANS: true })
      ]);

      if (cancelled()) {
        if (videoResult.status === "fulfilled") videoResult.value.close();
        if (audioResult.status === "fulfilled") audioResult.value.close();
        return;
      }

      if (videoResult.status === "fulfilled") videoTrack = videoResult.value;
      if (audioResult.status === "fulfilled") audioTrack = audioResult.value;

      if (!videoTrack && !audioTrack) {
        setPublishError("Camera and microphone access are needed for the call.");
        setPublishPhase("error");
        return;
      }

      if (videoTrack) await videoTrack.setEnabled(true);
      if (audioTrack) await audioTrack.setEnabled(true);

      let warmupEl: HTMLElement | null = null;
      if (videoTrack && typeof document !== "undefined") {
        warmupEl = document.createElement("div");
        warmupEl.id = `agora-warmup-${Date.now()}`;
        warmupEl.style.cssText =
          "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;";
        document.body.appendChild(warmupEl);
        try {
          videoTrack.play(warmupEl.id);
          await new Promise((r) => setTimeout(r, 400));
        } finally {
          warmupEl?.remove?.();
        }
      }
      if (cancelled()) return;

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      setPublishPhase("ready");

      await new Promise((r) => setTimeout(r, 300));
      if (cancelled()) return;

      const toPublish = [videoTrack, audioTrack].filter(Boolean) as (
        | ICameraVideoTrack
        | IMicrophoneAudioTrack
      )[];
      for (const t of toPublish) {
        await t.setEnabled(true);
      }
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled()) return;
      await client.publish(toPublish);
      // Refresh both tracks so the receiver reliably gets the stream (fixes caller not seen/heard until toggle)
      const refreshTrack = async (
        track: ICameraVideoTrack | IMicrophoneAudioTrack | null
      ) => {
        if (!track) return;
        try {
          await track.setEnabled(false);
          await new Promise((r) => setTimeout(r, 100));
          await track.setEnabled(true);
        } catch {
          // ignore
        }
      };
      await refreshTrack(videoTrack);
      await refreshTrack(audioTrack);
    } catch (err) {
      if (cancelled()) return;
      const message = err instanceof Error ? err.message : "Failed to start media";
      setPublishError(message);
      setPublishPhase("error");
      if (videoTrack) videoTrack.close();
      if (audioTrack) audioTrack.close();
    }
  }, [client, isConnected]);

  // Auto-start camera and microphone when connected so caller (UserA) sends media without tapping.
  // Wait for connectionState CONNECTED and a longer delay so the channel is ready to receive publish.
  const isReadyToPublish = connectionState === "CONNECTED" && isConnected;
  useEffect(() => {
    if (!isReadyToPublish || publishPhase !== "idle" || tracksCreatedRef.current) return;
    const t = setTimeout(() => {
      if (tracksCreatedRef.current) return;
      startMedia();
    }, 1000);
    return () => clearTimeout(t);
  }, [isReadyToPublish, publishPhase, startMedia]);

  const silenceAgoraAbort = useCallback((err: unknown) => {
    if (err instanceof Error && err.name === "AbortError") return;
    if (err instanceof DOMException && err.name === "AbortError") return;
    throw err;
  }, []);

  useEffect(() => {
    return () => {
      // Read latest tracks at unmount (not render-time snapshot); ref is the source of truth for Agora cleanup.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional tracksRef.current read in cleanup
      const snap = tracksRef.current;
      const video = snap.video;
      const audio = snap.audio;
      try {
        video?.close();
      } catch (e) {
        silenceAgoraAbort(e);
      }
      try {
        audio?.close();
      } catch (e) {
        silenceAgoraAbort(e);
      }
      client?.leave().catch(silenceAgoraAbort);
    };
  }, [client, silenceAgoraAbort]);

  const handleLeave = useCallback(async () => {
    const tracks: (ICameraVideoTrack | IMicrophoneAudioTrack)[] = [];
    if (localVideoTrack) tracks.push(localVideoTrack);
    if (localAudioTrack) tracks.push(localAudioTrack);
    for (const track of tracks) {
      try {
        await client?.unpublish([track]);
      } catch (e) {
        silenceAgoraAbort(e);
      }
      try {
        track.close();
      } catch (e) {
        silenceAgoraAbort(e);
      }
    }
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    try {
      await client?.leave();
    } catch (e) {
      silenceAgoraAbort(e);
    }
    onLeave();
  }, [client, localVideoTrack, localAudioTrack, onLeave, silenceAgoraAbort]);

  const toggleVideo = useCallback(async () => {
    if (!localVideoTrack) return;
    const willBeMuted = !videoMuted;
    await localVideoTrack.setEnabled(!willBeMuted);
    setVideoMuted(willBeMuted);
  }, [localVideoTrack, videoMuted]);

  const toggleAudio = useCallback(async () => {
    if (!localAudioTrack) return;
    const willBeMuted = !audioMuted;
    await localAudioTrack.setEnabled(!willBeMuted);
    setAudioMuted(willBeMuted);
  }, [localAudioTrack, audioMuted]);

  if (joinLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="mt-4 text-sm text-white/80">Connecting...</p>
      </div>
    );
  }

  if (publishPhase === "error") {
    const isTrackError =
      typeof publishError === "string" &&
      (publishError.includes("TRACK_IS_DISABLED") || publishError.includes("disabled track"));
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e] p-6">
        <p className="text-center text-red-400">{publishError ?? "Something went wrong"}</p>
        <p className="mt-2 text-center text-sm text-white/60">
          {isTrackError
            ? "Camera or microphone is not ready. Try leaving and rejoining the call."
            : "Check camera and microphone permissions."}
        </p>
        <button
          type="button"
          onClick={handleLeave}
          className="mt-6 rounded-full bg-white/20 px-6 py-3 text-white hover:bg-white/30"
        >
          Leave
        </button>
      </div>
    );
  }

  // Only show "Start camera" screen when there are no remote users. When the callee answers,
  // they must see the caller's video immediately; don't block on local camera.
  if (
    isConnected &&
    !localVideoTrack &&
    publishPhase !== "creating" &&
    remoteUsers.length === 0
  ) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e] p-6">
        <p className="text-center text-sm text-white/80">
          Tap below to turn on your camera and microphone so the other person can see and hear you.
        </p>
        <button
          type="button"
          onClick={startMedia}
          className="mt-6 rounded-full bg-white/20 px-8 py-4 text-white hover:bg-white/30 font-medium"
        >
          Start camera & microphone
        </button>
        <button
          type="button"
          onClick={handleLeave}
          className="mt-4 text-sm text-white/60 hover:text-white/80"
        >
          Leave call
        </button>
      </div>
    );
  }

  const showCreatingOverlay = publishPhase === "creating";
  const hasRemote = remoteUsers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d14]">
      {/* Main video: remote full screen when present, else self */}
      <div className="relative flex-1 min-h-0">
        {hasRemote ? (
          <div
            id={`remote-video-${remoteUsers[0].uid}`}
            className="absolute inset-0 bg-black [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black">
            <LocalUser
              audioTrack={localAudioTrack ?? undefined}
              videoTrack={localVideoTrack ?? undefined}
              playAudio={false}
              playVideo
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {hasRemote && (
          <div className="absolute left-0 right-0 top-4 flex justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">{remoteName}</span>
          </div>
        )}

        {/* Pip: self when remote is on main */}
        {hasRemote && (
          <div className="absolute right-4 top-4 z-10 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/30 bg-black shadow-xl sm:h-40 sm:w-28">
            <LocalUser
              audioTrack={localAudioTrack ?? undefined}
              videoTrack={localVideoTrack ?? undefined}
              playAudio={false}
              playVideo
              className="h-full w-full object-cover"
            />
            {videoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <svg className="h-8 w-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">You</span>
          </div>
        )}

        {!hasRemote && videoMuted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <span className="rounded-full bg-black/60 px-4 py-2 text-sm text-white/90">Camera off — tap to turn on</span>
          </div>
        )}

        {showCreatingOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d0d14]/95">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="mt-4 text-white">Starting camera and microphone...</p>
            <p className="mt-1 text-sm text-white/60">Allow access when prompted</p>
          </div>
        )}

        {remoteEndedMessage && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80">
            <p className="text-lg font-medium text-white">{remoteEndedMessage}</p>
            <p className="mt-2 text-sm text-white/70">Returning to chat...</p>
          </div>
        )}
      </div>

      {/* Bottom bar - Messenger style */}
      <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-black/50 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:gap-6 sm:py-6">
        <button
          type="button"
          onClick={toggleVideo}
          title={videoMuted ? "Turn on camera" : "Turn off camera"}
          className={`flex flex-col items-center gap-1.5 rounded-full px-4 py-3 transition-all sm:h-16 sm:w-16 sm:flex-shrink-0 sm:justify-center sm:px-0 ${
            videoMuted ? "bg-white/20 text-white" : "bg-white/30 text-white hover:bg-white/40"
          }`}
        >
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-xs sm:sr-only">{videoMuted ? "Camera off" : "Camera on"}</span>
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          title={audioMuted ? "Unmute" : "Mute"}
          className={`flex flex-col items-center gap-1.5 rounded-full px-4 py-3 transition-all sm:h-16 sm:w-16 sm:flex-shrink-0 sm:justify-center sm:px-0 ${
            audioMuted ? "bg-white/20 text-white" : "bg-white/30 text-white hover:bg-white/40"
          }`}
        >
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m0-3.5a3.5 3.5 0 11-7 0V11m7 3.5a3.5 3.5 0 01-7 0" />
          </svg>
          <span className="text-xs sm:sr-only">{audioMuted ? "Mic off" : "Mic on"}</span>
        </button>
        <button
          type="button"
          onClick={handleLeave}
          className="flex flex-col items-center gap-1.5 rounded-full bg-red-500 px-4 py-3 text-white transition hover:bg-red-600 sm:h-16 sm:w-16 sm:flex-shrink-0 sm:justify-center sm:px-0"
          title="End call"
        >
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs sm:sr-only">End call</span>
        </button>
      </div>
    </div>
  );
}

interface AgoraVideoCallProps {
  channelName: string;
  remoteName: string;
  onLeave: () => void;
}

export function AgoraVideoCall({ channelName, remoteName, onLeave }: AgoraVideoCallProps) {
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
    []
  );

  return (
    <AgoraRTCProvider client={client}>
      <AgoraVideoCallInner
        channelName={channelName}
        remoteName={remoteName}
        onLeave={onLeave}
      />
    </AgoraRTCProvider>
  );
}
