"use client";

import { usePathname } from "next/navigation";

type MainGridProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export function MainGrid({ left, center, right }: MainGridProps) {
  const pathname = usePathname();
  const isMessages = pathname?.startsWith("/messages");
  const isProfilePage = pathname?.startsWith("/linku-ai/profile");

  const gridCols = isMessages
    ? "xl:grid-cols-[260px_minmax(0,1fr)]"
    : isProfilePage
      ? "xl:grid-cols-[260px_minmax(0,1fr)]"
      : "xl:grid-cols-[260px_minmax(0,1fr)_340px]";

  return (
    <main
      className={`container-app grid h-screen max-h-screen grid-rows-[minmax(0,1fr)] gap-5 bg-page pt-14 overflow-hidden sm:gap-6 xl:gap-8 ${gridCols}`}
      id="main-content"
      role="main"
    >
      {/* Left sidebar: fixed in place, scrolls only inside this column if content overflows */}
      <div className="min-h-0 overflow-x-hidden overflow-y-auto scrollbar-hide pb-6">{left}</div>
      {/* Center: only this column scrolls; left and right stay fixed. Messages: center stays fixed, inner panels scroll. */}
      <div
        className={`min-h-0 overflow-x-hidden bg-page pb-6 scrollbar-hide ${isMessages ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {center}
      </div>
      {/* Right sidebar: fixed in place, scrolls only inside this column if content overflows */}
      {!isMessages && !isProfilePage ? (
        <div className="min-h-0 overflow-x-hidden overflow-y-auto scrollbar-hide pb-6">{right}</div>
      ) : null}
    </main>
  );
}
