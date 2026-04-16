import type { MentorProfile, StudentProfile } from "@prisma/client";

type MatchResult = {
  mentor: MentorProfile;
  score: number;
};

function inGpaRange(studentGpa: number, mentorAvgGpa?: number | null) {
  if (!mentorAvgGpa) return false;
  return Math.abs(studentGpa - mentorAvgGpa) <= 0.5;
}

function overlapCount(a: string[], b: string[]) {
  const setB = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase())).length;
}

export function rankMentorMatches(
  student: StudentProfile,
  mentors: MentorProfile[],
  mentorAverageStudentGpa: Map<string, number | null>
): MatchResult[] {
  const weighted = mentors.map((mentor) => {
    let score = 0;

    if (mentor.major.toLowerCase() === student.intendedMajor.toLowerCase()) score += 35;
    if (mentor.country.toLowerCase() === student.country.toLowerCase()) score += 20;

    const gpaHint = mentorAverageStudentGpa.get(mentor.id) ?? null;
    if (inGpaRange(Number(student.gpa), gpaHint)) score += 20;

    const overlap = overlapCount(student.targetUniversities, mentor.acceptedUniversities);
    score += Math.min(overlap * 10, 25);

    return { mentor, score };
  });

  return weighted.sort((a, b) => b.score - a.score).slice(0, 5);
}
