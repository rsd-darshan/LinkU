/**
 * Clerk validates publishable keys at runtime (including during `next build` static generation).
 * Short or malformed keys must not mount `<ClerkProvider />`.
 */
export function isUsableClerkPublishableKey(key: string | undefined): key is string {
  const k = key?.trim();
  if (!k) return false;
  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) return false;
  // Real keys carry a long signed payload; short strings are usually malformed.
  return k.length >= 50;
}
