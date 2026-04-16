"use client";

import { useEffect, useState } from "react";

const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";

type LottiePlayerProps = {
  src: string;
  className?: string;
  width?: number;
  height?: number;
};

export function LottiePlayer({
  src,
  className = "",
  width = 300,
  height = 300,
}: LottiePlayerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.querySelector(`script[src="${DOTLOTTIE_SCRIPT}"]`);
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = DOTLOTTIE_SCRIPT;
    script.type = "module";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  if (!ready) {
    return (
      <div
        className={`flex min-h-[300px] min-w-[300px] items-center justify-center rounded-input bg-slate-100/80 ${className}`}
        aria-hidden
      >
        <span className="text-body-sm text-slate-400">Loading…</span>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden>
      {/* @ts-expect-error custom element dotlottie-wc */}
      <dotlottie-wc
        src={src}
        autoplay
        loop
        style={{ width, height }}
        className="rounded-input"
      />
    </div>
  );
}
