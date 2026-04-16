import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppSidebarLeft } from "@/components/layout/app-sidebars";
import { MainGrid } from "@/components/layout/main-grid";
import { RightSidebarConditional } from "@/components/layout/right-sidebar-conditional";
import { TopNav } from "@/components/layout/top-nav";
import { AgoraCallProvider } from "@/components/calls/agora-call-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";

export const metadata: Metadata = {
  title: "LinkU",
  description: "Student-to-mentor and student-to-student networking platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    return (
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
          <link rel="preload" as="script" href={DOTLOTTIE_SCRIPT} />
          <script src={DOTLOTTIE_SCRIPT} type="module" async />
        </head>
        <body className="font-sans" suppressHydrationWarning>
          <AgoraCallProvider>
            <TopNav />
            <Suspense
              fallback={
                <main className="container-app grid gap-8 pb-6 pt-14 xl:grid-cols-[260px_minmax(0,1fr)_340px] min-h-[70vh] bg-page" />
              }
            >
              <MainGrid
                left={<AppSidebarLeft />}
                center={children}
                right={
                  <Suspense fallback={<aside className="hidden xl:block" aria-hidden="true" />}>
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
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
          <link rel="preload" as="script" href={DOTLOTTIE_SCRIPT} />
          <script src={DOTLOTTIE_SCRIPT} type="module" async />
        </head>
        <body className="font-sans" suppressHydrationWarning>
          <AgoraCallProvider>
            <TopNav />
            <Suspense
              fallback={
                <main className="container-app grid gap-8 pb-6 pt-14 xl:grid-cols-[260px_minmax(0,1fr)_340px] min-h-[70vh] bg-page" />
              }
            >
              <MainGrid
                left={<AppSidebarLeft />}
                center={children}
                right={
                  <Suspense fallback={<aside className="hidden xl:block" aria-hidden="true" />}>
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
