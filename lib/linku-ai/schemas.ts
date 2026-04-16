import { z } from "zod";

const optionalTrimmedString = (min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || undefined : v),
    z.string().min(min).max(max).optional()
  );

const rating1To10 = z.number().int().min(1).max(10);
const optionalRating1To10 = z.number().int().min(1).max(10).optional();

const otherScoreSchema = z.object({ name: z.string().min(1).max(120), value: z.string().max(50) });
export const globalProfileSchema = z.object({
  gpa: z.number().min(0).max(4.5).optional().nullable(),
  sat: z.number().int().min(400).max(1600).optional().nullable(),
  schoolContext: optionalTrimmedString(1, 2000).nullable(),
  ecasJson: z.union([z.array(z.string().max(500)), z.string()]).optional(),
  honorsJson: z.union([z.array(z.string().max(500)), z.string()]).optional(),
  awardsJson: z.union([z.array(z.string().max(500)), z.string()]).optional(),
  otherScoresJson: z.array(otherScoreSchema).optional(),
  intendedMajor: optionalTrimmedString(1, 120).nullable(),
  personalEssay: optionalTrimmedString(1, 10000).nullable(),
  lorRating: optionalRating1To10.nullable(),
  hooksJson: z.union([z.array(z.string().max(200)), z.string()]).optional().nullable(),
  resumeUrl: z.string().url().optional().nullable().or(z.literal("")),
});

const supplementEssayItemSchema = z.object({
  heading: z.string().max(500),
  wordLimit: z.number().int().min(0).max(5000).nullable(),
  answer: z.string().max(50000).default(""),
});

export const supplementEssaysArraySchema = z.array(supplementEssayItemSchema).max(50);

export const applicationSchema = z.object({
  universityId: z.string().min(1),
  round: z.enum(["ED", "ED2", "EA", "REA", "RD", "ROLLING"]),
  financialAidRequest: z.boolean().optional().nullable(),
  supplementEssay: optionalTrimmedString(1, 10000).optional().nullable(),
  supplementEssaysJson: supplementEssaysArraySchema.optional().nullable(),
  universitySpecificQuestions: z.record(z.string(), z.unknown()).optional().nullable(),
  portfolioLinks: z.array(z.string().url().max(500)).optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});

export type SupplementEssayItem = z.infer<typeof supplementEssayItemSchema>;

export const lorSchema = z.object({
  teacherName: z.string().min(1).max(200),
  strengthRating: rating1To10,
  relationshipRating: rating1To10,
  credibilityRating: rating1To10,
});

export const compareRequestSchema = z.object({
  userAId: z.string().min(1),
  userBId: z.string().min(1),
  universityId: z.string().min(1),
});

export const myFitRequestSchema = z.object({
  universityId: z.string().min(1),
});

export const essayAnalyzeSchema = z.object({
  essayType: z.enum(["PERSONAL", "SUPPLEMENT"]),
  content: z.string().min(1).max(50000),
  universityId: z.string().min(1).optional(), // required when essayType === SUPPLEMENT
});

export const admissionsOutcomeSchema = z.object({
  universityId: z.string().min(1),
  result: z.enum(["ACCEPTED", "REJECTED", "WAITLIST"]),
  profileVector: z.record(z.string(), z.unknown()),
  userId: z.string().optional().nullable(),
});

export const selfOutcomeSchema = z.object({
  universityId: z.string().min(1),
  result: z.enum(["ACCEPTED", "REJECTED", "WAITLIST"]),
});

export type GlobalProfileInput = z.infer<typeof globalProfileSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type LorInput = z.infer<typeof lorSchema>;
export type CompareRequestInput = z.infer<typeof compareRequestSchema>;
export type EssayAnalyzeInput = z.infer<typeof essayAnalyzeSchema>;
export type AdmissionsOutcomeInput = z.infer<typeof admissionsOutcomeSchema>;
