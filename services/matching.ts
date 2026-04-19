import type { MentorProfile, StudentProfile } from "@prisma/client";

type MatchResult = {
  mentor: MentorProfile;
  score: number;
  breakdown: MatchBreakdown;
};

export type MatchWeights = {
  major: number;
  country: number;
  gpa: number;
  universityOverlapCap: number;
  verificationBadge: number;
  rating: number;
};

export type MatchBreakdown = {
  major: number;
  country: number;
  gpa: number;
  universities: number;
  verificationBadge: number;
  rating: number;
};

type RankOptions = {
  limit?: number;
  weights?: Partial<MatchWeights>;
};

const DEFAULT_WEIGHTS: MatchWeights = {
  major: 30,
  country: 15,
  gpa: 25,
  universityOverlapCap: 20,
  verificationBadge: 5,
  rating: 5
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function overlapCount(a: string[], b: string[]) {
  const setB = new Set(b.map((item) => normalize(item)));
  return a.filter((item) => setB.has(normalize(item))).length;
}

function getGpaScore(studentGpaRaw: StudentProfile["gpa"], mentorAvgGpa?: number | null, maxScore = 25) {
  const studentGpa = Number(studentGpaRaw);
  if (!Number.isFinite(studentGpa) || !mentorAvgGpa) return 0;

  const distance = Math.abs(studentGpa - mentorAvgGpa);
  if (distance <= 0.15) return maxScore;
  if (distance <= 0.35) return Math.round(maxScore * 0.8);
  if (distance <= 0.5) return Math.round(maxScore * 0.5);
  return 0;
}

function getRatingScore(mentor: MentorProfile, maxScore = 5) {
  const rating = Number(mentor.averageRating ?? 0);
  if (!Number.isFinite(rating) || rating < 4 || mentor.reviewCount < 2) return 0;

  const normalized = Math.min(rating, 5) / 5;
  return Math.round(normalized * maxScore);
}

function getWeights(overrides?: Partial<MatchWeights>): MatchWeights {
  return {
    major: overrides?.major ?? DEFAULT_WEIGHTS.major,
    country: overrides?.country ?? DEFAULT_WEIGHTS.country,
    gpa: overrides?.gpa ?? DEFAULT_WEIGHTS.gpa,
    universityOverlapCap: overrides?.universityOverlapCap ?? DEFAULT_WEIGHTS.universityOverlapCap,
    verificationBadge: overrides?.verificationBadge ?? DEFAULT_WEIGHTS.verificationBadge,
    rating: overrides?.rating ?? DEFAULT_WEIGHTS.rating
  };
}

export function rankMentorMatches(
  student: StudentProfile,
  mentors: MentorProfile[],
  mentorAverageStudentGpa: Map<string, number | null>,
  options?: RankOptions
): MatchResult[] {
  const limit = options?.limit ?? 5;
  const weights = getWeights(options?.weights);

  const weighted = mentors.map((mentor) => {
    const breakdown: MatchBreakdown = {
      major: 0,
      country: 0,
      gpa: 0,
      universities: 0,
      verificationBadge: 0,
      rating: 0
    };

    if (normalize(mentor.major) === normalize(student.intendedMajor)) breakdown.major = weights.major;
    if (normalize(mentor.country) === normalize(student.country)) breakdown.country = weights.country;

    const gpaHint = mentorAverageStudentGpa.get(mentor.id) ?? null;
    breakdown.gpa = getGpaScore(student.gpa, gpaHint, weights.gpa);

    const overlap = overlapCount(student.targetUniversities, mentor.acceptedUniversities);
    breakdown.universities = Math.min(overlap * 10, weights.universityOverlapCap);

    if (mentor.verificationBadge) breakdown.verificationBadge = weights.verificationBadge;
    breakdown.rating = getRatingScore(mentor, weights.rating);

    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    return { mentor, score, breakdown };
  });

  return weighted.sort((a, b) => b.score - a.score).slice(0, limit);
}
