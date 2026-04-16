import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Routes that require sign-in. Unauthenticated users are redirected to sign-in. */
const isProtectedRoute = createRouteMatcher([
  "/",
  "/dashboard(.*)",
  "/profile(.*)",
  "/channels(.*)",
  "/messages(.*)",
  "/admin(.*)",
  "/api/admin(.*)",
  "/booking(.*)",
  "/mentors(.*)",
  "/linku-ai(.*)",
  "/networking(.*)",
  "/notifications(.*)",
  "/reviews(.*)",
  "/feed(.*)",
  "/search(.*)",
  "/post(.*)",
]);
/** Admin-only routes: redirect non-admins to dashboard. */
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"]
};
