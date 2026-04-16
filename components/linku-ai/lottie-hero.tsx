"use client";

import { useEffect, useState } from "react";

const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";
const LOTTIE_SRC =
  "https://lottie.host/2723e1cd-1987-4972-bf6e-48ed5ff1b2b6/AqBoUOyZlG.lottie";

export function LottieHero() {
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

  if (!ready) {
    return (
      <div
        className="flex min-h-[300px] min-w-[300px] items-center justify-center rounded-input bg-slate-100/80"
        aria-hidden
      >
        <span className="text-body-sm text-slate-400">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-end" aria-hidden>
      {/* @ts-expect-error custom element dotlottie-wc */}
      <dotlottie-wc
        src={LOTTIE_SRC}
        autoplay
        loop
        style={{ width: 300, height: 300 }}
        className="rounded-input"
      />
    </div>
  );
}
