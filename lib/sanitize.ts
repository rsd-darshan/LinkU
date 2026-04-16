export function sanitizeText(input: string) {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/\s{2,}/g, " ");
}

export function toSlug(input: string) {
  return sanitizeText(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
