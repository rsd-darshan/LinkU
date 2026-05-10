/**
 * Fetch IPEDS/NCES data.
 * This module intentionally returns `null` until a verified source is wired.
 */
export async function fetchIpedsForUnit(
  _unitId: string,
  _year: number
): Promise<Record<string, unknown> | null> {
  return null;
}
