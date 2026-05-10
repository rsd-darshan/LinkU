import { clerkClient } from "@clerk/nextjs/server";

/** Resolve Clerk profile image URLs for a de-duplicated list of Clerk user IDs. */
export async function clerkImageUrlByClerkId(clerkIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(clerkIds.filter(Boolean))];
  const map = new Map<string, string | null>();
  if (unique.length === 0) return map;

  const clerk = await clerkClient();
  await Promise.all(
    unique.map(async (clerkId) => {
      try {
        const user = await clerk.users.getUser(clerkId);
        map.set(clerkId, user.imageUrl || null);
      } catch {
        map.set(clerkId, null);
      }
    })
  );
  return map;
}

export async function clerkImageUrlForUser(clerkId: string): Promise<string | null> {
  const map = await clerkImageUrlByClerkId([clerkId]);
  return map.get(clerkId) ?? null;
}
