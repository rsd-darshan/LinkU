import { z } from "zod";

const optionalTrimmedString = (min: number, max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().min(min).max(max).optional());

const optionalInt = (min: number, max: number) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.number().int().min(min).max(max).optional());

const optionalNumber = (min: number, max: number) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.number().min(min).max(max).optional());

const parsedDate = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return value;
}, z.date());

const mediaUrlSchema = z.string().refine((value) => {
  if (value.startsWith("/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "Invalid media URL");

export const onboardingSchema = z.object({
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]),
  fullName: z.string().min(2).max(100),
  country: z.string().min(2).max(80),
  gpa: optionalNumber(0, 5),
  satScore: optionalInt(400, 1600),
  actScore: optionalInt(1, 36),
  intendedMajor: optionalTrimmedString(2, 120),
  targetUniversities: z.array(z.string().min(2).max(120)).default([]),
  bio: optionalTrimmedString(1, 2000),
  achievements: z.array(z.string().max(300)).default([]),
  isVisible: z.boolean().default(true),
  university: optionalTrimmedString(2, 120),
  major: optionalTrimmedString(2, 120),
  graduationYear: optionalInt(1990, 2100),
  acceptedUniversities: z.array(z.string().min(2).max(120)).default([]),
  scholarships: z.array(z.string().min(2).max(120)).default([]),
  hourlyRateCents: optionalInt(1000, 100000),
  availableTimeSlots: z.array(parsedDate).default([])
});

export const bookingCreateSchema = z.object({
  mentorId: z.string().cuid(),
  startTime: parsedDate,
  durationMinutes: z.union([z.literal(30), z.literal(60)])
});

export const reviewCreateSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export const connectionRequestSchema = z.object({
  receiverId: z.string().cuid()
});

export const connectionRespondSchema = z.object({
  connectionId: z.string().cuid(),
  action: z.enum(["ACCEPTED", "DECLINED"])
});

export const messageCreateSchema = z.object({
  receiverId: z.string().cuid(),
  body: z.string().min(1).max(2000),
  messageType: z.enum(["TEXT", "SHARED_POST"]).default("TEXT"),
  postId: z.string().cuid().optional(),
  connectionId: z.string().cuid().optional(),
  bookingId: z.string().cuid().optional()
}).refine((data) => {
  if (data.messageType === "SHARED_POST" && !data.postId) {
    return false;
  }
  if (data.messageType === "TEXT" && data.postId) {
    return false;
  }
  return true;
}, {
  message: "postId is required when messageType is SHARED_POST",
  path: ["postId"]
});

export const channelCreateSchema = z.object({
  name: z.string().min(2).max(120),
  universityName: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional()
});

export const postCreateSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(1).max(5000),
  mediaUrls: z.array(mediaUrlSchema).max(6).optional().default([])
});

export const channelPostCreateSchema = postCreateSchema.extend({
  channelSlug: z.string().min(2).max(160)
});

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(1200),
  parentId: z.string().cuid().optional()
});

/** Presigned upload: restrict content types and file name length. */
export const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100).refine(
    (v) => /^[a-z0-9+-]+\/[a-z0-9+-.]+$/i.test(v),
    { message: "Invalid content type" }
  ),
});
