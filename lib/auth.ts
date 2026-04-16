import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId }
  });
  if (existing) return existing;

  return syncClerkUserToDb();
}

export async function requireUser() {
  const user = await getCurrentDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/** Use in Server Components: returns user or redirects to sign-in. */
export async function requireUserRedirect(signInUrl = "/sign-in") {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect(signInUrl);
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function syncClerkUserToDb() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const created = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      role: "STUDENT"
    }
  });

  await syncClerkRoleMetadata(created.clerkId, created.role);
  return created;
}

export async function syncClerkRoleMetadata(clerkId: string, role: Role) {
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { role }
  });
}
