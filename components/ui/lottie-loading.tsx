"use client";

import { useEffect, useState } from "react";

const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";
const LOADING_LOTTIE_SRC =
  "https://lottie.host/7754b213-31f7-4084-9e81-3bf5fb5801f5/5FZzOl0L8e.lottie";

export function LottieLoading() {
  const [ready, setReady] = useState(
    () => typeof document !== "undefined" && Boolean(document.querySelector(`script[src="${DOTLOTTIE_SCRIPT}"]`))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.querySelector(`script[src="${DOTLOTTIE_SCRIPT}"]`);
    if (existing) {
      return;
    }
    const script = document.createElement("script");
    script.src = DOTLOTTIE_SCRIPT;
    script.type = "module";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return (
    <div
      className="relative flex min-h-[300px] min-w-[300px] items-center justify-center"
      aria-hidden
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
        </div>
      )}

      {/* @ts-expect-error custom element dotlottie-wc */}
      <dotlottie-wc
        src={LOADING_LOTTIE_SRC}
        autoplay
        loop
        style={{ width: 300, height: 300 }}
      />
    </div>
  );
}
