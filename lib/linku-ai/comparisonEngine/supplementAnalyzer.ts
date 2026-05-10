import { prisma } from "@/lib/prisma";
import { openRouterJson } from "../openrouter";

export type EssayScores = {
  coherence: number;
  narrativeDepth: number;
  originality: number;
  alignment: number;
  essayScore0_100: number;
  valueAlignmentScore0_100?: number;
};

const ESSAY_SYSTEM_PROMPT = `You are an admissions evaluator. Score strictly from 1 to 10 for: coherence, narrative_depth, originality, alignment_with_university_values.
Return ONLY a JSON object with keys: coherence, narrative_depth, originality, alignment (all integers 1-10).
Do not include any other text.`;

export async function analyzeEssay(
  content: string,
  universityValues?: string[]
): Promise<EssayScores> {
  const userPrompt = universityValues?.length
    ? `Evaluate this essay. University values to align with: ${universityValues.join(", ")}.\n\nEssay:\n${content.slice(0, 8000)}`
    : `Evaluate this essay.\n\nEssay:\n${content.slice(0, 8000)}`;

  const raw = await openRouterJson<{
    coherence?: number;
    narrative_depth?: number;
    originality?: number;
    alignment?: number;
  }>([
    { role: "system", content: ESSAY_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const coherence = Math.max(1, Math.min(10, Number(raw.coherence) || 5));
  const narrativeDepth = Math.max(1, Math.min(10, Number(raw.narrative_depth) || 5));
  const originality = Math.max(1, Math.min(10, Number(raw.originality) || 5));
  const alignment = Math.max(1, Math.min(10, Number(raw.alignment) || 5));

  const essayScore0_100 = Math.round(
    ((coherence + narrativeDepth + originality + alignment) / 40) * 100
  );
  const valueAlignmentScore0_100 = universityValues?.length ? Math.round((alignment / 10) * 100) : undefined;

  return {
    coherence,
    narrativeDepth,
    originality,
    alignment,
    essayScore0_100,
    valueAlignmentScore0_100,
  };
}

export async function getUniversityValues(universityId: string): Promise<string[]> {
  const uv = await prisma.universityValues.findUnique({
    where: { universityId },
  });
  if (!uv) return [];
  const v = uv.valuesJson;
  return Array.isArray(v) ? (v as string[]) : [];
}
