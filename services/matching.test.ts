import { describe, expect, it } from "vitest";
import { MentorVerificationStatus, type MentorProfile, type StudentProfile } from "@prisma/client";
import { rankMentorMatches } from "./matching";

const now = new Date();

function mockStudent(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: "stu1",
    userId: "u1",
    fullName: "Student",
    country: "US",
    gpa: "3.70" as unknown as StudentProfile["gpa"],
    satScore: null,
    actScore: null,
    intendedMajor: "Computer Science",
    targetUniversities: ["MIT", "Stanford"],
    bio: null,
    achievements: [],
    isVisible: true,
    createdAt: now,
    updatedAt: now,
    ...over
  };
}

function mockMentor(id: string, over: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id,
    userId: `mu-${id}`,
    fullName: "Mentor",
    country: "US",
    university: "MIT",
    major: "Computer Science",
    graduationYear: 2024,
    acceptedUniversities: ["MIT"],
    scholarships: [],
    hourlyRateCents: 5000,
    availableTimeSlots: [],
    verificationStatus: MentorVerificationStatus.APPROVED,
    verificationBadge: true,
    averageRating: "4.50" as unknown as MentorProfile["averageRating"],
    reviewCount: 2,
    bio: null,
    createdAt: now,
    updatedAt: now,
    ...over
  };
}

describe("rankMentorMatches", () => {
  it("returns top 5 sorted by score descending", () => {
    const student = mockStudent({ gpa: "3.70" as unknown as StudentProfile["gpa"] });
    const mentors = [
      mockMentor("m-low", { major: "History", country: "CA", acceptedUniversities: [] }),
      mockMentor("m-high", {
        major: "Computer Science",
        country: "US",
        acceptedUniversities: ["MIT", "Stanford"]
      })
    ];
    const gpaMap = new Map<string, number | null>([
      ["m-low", 2.0],
      ["m-high", 3.7]
    ]);

    const out = rankMentorMatches(student, mentors, gpaMap);
    expect(out.map((x) => x.mentor.id)).toEqual(["m-high", "m-low"]);
    expect(out[0].score).toBeGreaterThan(out[1].score);
    expect(out[0].breakdown.major).toBeGreaterThan(0);
    expect(out[0].breakdown.universities).toBeGreaterThan(0);
  });

  it("returns empty for empty mentors", () => {
    const student = mockStudent();
    expect(rankMentorMatches(student, [], new Map())).toEqual([]);
  });

  it("respects custom limits and weights", () => {
    const student = mockStudent();
    const mentors = [
      mockMentor("m1", { major: "Computer Science", acceptedUniversities: ["MIT"] }),
      mockMentor("m2", { major: "Computer Science", acceptedUniversities: ["Stanford"] }),
      mockMentor("m3", { major: "History", acceptedUniversities: ["MIT"] })
    ];
    const gpaMap = new Map<string, number | null>([
      ["m1", 3.7],
      ["m2", 3.6],
      ["m3", 3.7]
    ]);

    const out = rankMentorMatches(student, mentors, gpaMap, {
      limit: 2,
      weights: {
        major: 50,
        country: 0,
        universityOverlapCap: 10,
        verificationBadge: 0,
        rating: 0
      }
    });

    expect(out).toHaveLength(2);
    expect(out[0].mentor.id).toBe("m1");
    expect(out[1].mentor.id).toBe("m2");
  });
});
