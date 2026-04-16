/**
 * Estimate major competitiveness multiplier (0.8 - 1.3).
 * Rule-based: CS at elite schools higher; less competitive majors lower.
 */
const ELITE_SLUGS = new Set([
  "mit", "stanford", "harvard", "princeton", "yale", "columbia", "upenn", "caltech",
  "duke", "northwestern", "dartmouth", "brown", "vanderbilt", "rice", "washu", "cornell",
]);

const HIGH_DEMAND_MAJORS = new Set([
  "computer science", "cs", "engineering", "ece", "data science", "economics", "business",
]);

const LOWER_DEMAND_MAJORS = new Set([
  "classics", "religion", "philosophy", "history", "english", "linguistics",
]);

export function estimateMajorMultiplier(
  universitySlug: string,
  majorName: string
): number {
  const slug = universitySlug.toLowerCase().trim();
  const major = majorName.toLowerCase().trim();
  const isElite = ELITE_SLUGS.has(slug);
  const isHighDemand = HIGH_DEMAND_MAJORS.has(major) || major.includes("computer") || major.includes("engineering");
  const isLowerDemand = LOWER_DEMAND_MAJORS.has(major);

  if (isElite && isHighDemand) return 1.2;
  if (isHighDemand) return 1.1;
  if (isLowerDemand) return 0.9;
  return 1.0;
}
