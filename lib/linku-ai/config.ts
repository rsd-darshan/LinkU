/**
 * LinkU-AI config: scoring weights and validation bounds.
 * Weights are configurable via env so no hardcoded probabilities.
 */

const num = (v: string | undefined, fallback: number): number => {
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

export const linkuAiConfig = {
  /** University-relative composite weights (must sum to 100) */
  weights: {
    academic: num(process.env.LINKU_AI_WEIGHT_ACADEMIC, 40),
    eca: num(process.env.LINKU_AI_WEIGHT_ECA, 25),
    majorAlignment: num(process.env.LINKU_AI_WEIGHT_MAJOR, 15),
    essay: num(process.env.LINKU_AI_WEIGHT_ESSAY, 10),
    contextStrategy: num(process.env.LINKU_AI_WEIGHT_CONTEXT, 10),
  },

  /** Validation bounds for university statistics */
  validation: {
    gpaMin: 0,
    gpaMax: 4.5,
    satMin: 400,
    satMax: 1600,
    acceptanceRateMin: 0,
    acceptanceRateMax: 100,
    /** Max allowed year-over-year change (e.g. 30 = 30%) */
    yoyVariationMaxPercent: num(process.env.LINKU_AI_YOY_VARIATION_MAX, 30),
  },

  /** Band thresholds for university-relative score (composite 0–100) */
  bands: {
    strongMatchMin: num(process.env.LINKU_AI_BAND_STRONG_MATCH_MIN, 70),
    competitiveMin: num(process.env.LINKU_AI_BAND_COMPETITIVE_MIN, 50),
    reachMin: num(process.env.LINKU_AI_BAND_REACH_MIN, 30),
    // below reachMin = High Reach
  },

  /** OpenRouter */
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL ?? "openai/gpt-4o-mini",
  },
} as const;

export type FitBand = "HIGH_REACH" | "REACH" | "COMPETITIVE" | "STRONG_MATCH";

export function getBandFromCompositeScore(composite0To100: number): FitBand {
  const { strongMatchMin, competitiveMin, reachMin } = linkuAiConfig.bands;
  if (composite0To100 >= strongMatchMin) return "STRONG_MATCH";
  if (composite0To100 >= competitiveMin) return "COMPETITIVE";
  if (composite0To100 >= reachMin) return "REACH";
  return "HIGH_REACH";
}
