"use client";

import { usePathname } from "next/navigation";

type MainGridProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

/** Sticky side rails; outer columns flex so rails hug left/right of the viewport shell. */
const railClass =
  "hidden min-h-0 min-w-0 shrink-0 self-start pb-6 scrollbar-hide xl:block xl:sticky xl:top-14 xl:max-h-[calc(100dvh-3.5rem)] xl:overflow-y-auto xl:overscroll-y-contain [scrollbar-gutter:stable]";

export function MainGrid({ left, center, right }: MainGridProps) {
  const pathname = usePathname();
  const isMessages = pathname?.startsWith("/messages") ?? false;
  const isProfilePage = pathname?.startsWith("/linku-ai/profile") ?? false;
  const showRightContent = !isMessages && !isProfilePage;
  const centerSurface = "bg-page text-ink xl:border-line";
  const centerScroll = isMessages
    ? "overflow-hidden xl:overflow-hidden xl:border-x-0"
    : "overflow-y-auto overscroll-y-contain xl:overflow-y-auto xl:overscroll-y-contain";

  const desktopGridCols = isMessages
    ? "xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
    : "xl:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,820px))_minmax(0,1fr)]";
  const centerWidth = isMessages
    ? "max-w-none justify-self-stretch xl:max-w-none xl:justify-self-stretch xl:px-6"
    : "max-w-[min(100%,820px)] justify-self-center xl:px-8";

  return (
    <main
      className={`layout-shell grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 grid-rows-[minmax(0,1fr)] gap-0 bg-page pt-[3.5rem] min-w-0 overflow-x-hidden xl:h-dvh xl:max-h-dvh xl:min-h-0 xl:overflow-hidden xl:items-stretch ${desktopGridCols}`}
      id="main-content"
      role="main"
    >
      <div className={`${railClass} w-full max-w-[300px] justify-self-start xl:pl-0`}>{left}</div>
      <div
        className={`min-h-0 min-w-0 w-full overflow-x-hidden px-4 pb-8 pt-0 sm:px-5 md:px-7 xl:h-full xl:max-h-full scrollbar-hide xl:border-x ${centerSurface} ${centerScroll} ${centerWidth}`}
      >
        {center}
      </div>
      <div className={`${isMessages ? "hidden" : railClass} w-full max-w-[380px] justify-self-end xl:pr-0`}>
        {showRightContent ? right : <div className="hidden xl:block xl:min-h-px" aria-hidden />}
      </div>
    </main>
  );
}
