import { openRouterJson } from "../openrouter";

export type CompareInput = {
  universityData: Record<string, unknown>;
  userAProfile: Record<string, unknown>;
  userASupplementOrEssay: string | null;
  userBProfile: Record<string, unknown>;
  userBSupplementOrEssay: string | null;
};

export type CompareOutput = {
  academicFitComparison: string;
  ecaComparison: string;
  majorAlignmentComparison: string;
  essayComparison: string;
  supplementValueComparison: string;
  lorComparison: string;
  finalAdvantage: "A" | "B" | "TIE";
  explanation: string;
};

const COMPARE_SYSTEM = `You are an admissions comparison expert. You will receive JSON with:
- university_data: university stats and context
- userA_profile, userA_supplement_or_essay: first applicant
- userB_profile, userB_supplement_or_essay: second applicant

Compare STRICTLY based on the provided data only. Do not use external knowledge.
Return ONLY a JSON object with these exact keys (all strings, except finalAdvantage is "A" or "B" or "TIE"):
- academicFitComparison
- ecaComparison
- majorAlignmentComparison
- essayComparison
- supplementValueComparison
- lorComparison
- finalAdvantage ("A" or "B" or "TIE")
- explanation`;

export async function compareProfiles(input: CompareInput): Promise<CompareOutput> {
  const userPrompt = `Compare these two applicants for the given university. Use only the data below.

University data:
${JSON.stringify(input.universityData, null, 2)}

User A profile:
${JSON.stringify(input.userAProfile, null, 2)}

User A essay/supplement:
${input.userASupplementOrEssay ?? "(none)"}

User B profile:
${JSON.stringify(input.userBProfile, null, 2)}

User B essay/supplement:
${input.userBSupplementOrEssay ?? "(none)"}

Return the comparison JSON.`;

  const raw = await openRouterJson<CompareOutput>([
    { role: "system", content: COMPARE_SYSTEM },
    { role: "user", content: userPrompt.slice(0, 12000) },
  ]);

  return {
    academicFitComparison: String(raw.academicFitComparison ?? ""),
    ecaComparison: String(raw.ecaComparison ?? ""),
    majorAlignmentComparison: String(raw.majorAlignmentComparison ?? ""),
    essayComparison: String(raw.essayComparison ?? ""),
    supplementValueComparison: String(raw.supplementValueComparison ?? ""),
    lorComparison: String(raw.lorComparison ?? ""),
    finalAdvantage: raw.finalAdvantage === "A" || raw.finalAdvantage === "B" ? raw.finalAdvantage : "TIE",
    explanation: String(raw.explanation ?? ""),
  };
}
