/**
 * Get combined supplement text from an application.
 * Uses supplementEssaysJson (array of { answer }) if present, else supplementEssay.
 */
export function getCombinedSupplementText(app: {
  supplementEssay?: string | null;
  supplementEssaysJson?: unknown;
} | null): string | null {
  if (!app) return null;
  const arr = app.supplementEssaysJson;
  if (Array.isArray(arr) && arr.length > 0) {
    const parts = arr
      .map((item: unknown) => {
        if (item && typeof item === "object" && "answer" in item) {
          const a = (item as Record<string, unknown>).answer;
          return typeof a === "string" ? a.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join("\n\n---\n\n");
    return null;
  }
  const single = app.supplementEssay?.trim();
  return single ?? null;
}
