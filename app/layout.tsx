import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppSidebarLeft } from "@/components/layout/app-sidebars";
import { MainGrid } from "@/components/layout/main-grid";
import { RightSidebarConditional } from "@/components/layout/right-sidebar-conditional";
import { TopNav } from "@/components/layout/top-nav";
import { AgoraCallProvider } from "@/components/calls/agora-call-provider";
import { isUsableClerkPublishableKey } from "@/lib/clerk-publishable-key";
import "./globals.css";

const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "LinkU",
  description: "Student-to-mentor and student-to-student networking platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkEnabled = isUsableClerkPublishableKey(clerkKey);

  if (!clerkEnabled) {
    return (
      <html lang="en" className={fontSans.variable}>
        <head>
          <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
          <link rel="preload" as="script" href={DOTLOTTIE_SCRIPT} />
          <script src={DOTLOTTIE_SCRIPT} type="module" async />
        </head>
        <body className="font-sans antialiased" suppressHydrationWarning>
          <AgoraCallProvider>
            <TopNav />
            <Suspense
              fallback={
                <main className="layout-shell grid min-h-[70vh] grid-cols-1 gap-0 bg-page pb-6 pt-[3.5rem] xl:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,820px))_minmax(0,1fr)]" />
              }
            >
              <MainGrid
                left={<AppSidebarLeft />}
                center={children}
                right={
                  <Suspense
                    fallback={
                      <aside className="hidden min-h-px w-full max-w-[380px] shrink-0 xl:block" aria-hidden="true" />
                    }
                  >
                    <RightSidebarConditional />
                  </Suspense>
                }
              />
            </Suspense>
          </AgoraCallProvider>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="en" className={fontSans.variable}>
        <head>
          <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
          <link rel="preload" as="script" href={DOTLOTTIE_SCRIPT} />
          <script src={DOTLOTTIE_SCRIPT} type="module" async />
        </head>
        <body className="font-sans antialiased" suppressHydrationWarning>
          <AgoraCallProvider>
            <TopNav />
            <Suspense
              fallback={
                <main className="layout-shell grid min-h-[70vh] grid-cols-1 gap-0 bg-page pb-6 pt-[3.5rem] xl:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,820px))_minmax(0,1fr)]" />
              }
            >
              <MainGrid
                left={<AppSidebarLeft />}
                center={children}
                right={
                  <Suspense
                    fallback={
                      <aside className="hidden min-h-px w-full max-w-[380px] shrink-0 xl:block" aria-hidden="true" />
                    }
                  >
                    <RightSidebarConditional />
                  </Suspense>
                }
              />
            </Suspense>
          </AgoraCallProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
