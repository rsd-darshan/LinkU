import { prisma } from "@/lib/prisma";

const DEMO_USERS = [
  { clerkId: "demo_student_aria", email: "aria.demo@linku.local", role: "STUDENT", fullName: "Aria Patel" },
  { clerkId: "demo_student_daniel", email: "daniel.demo@linku.local", role: "STUDENT", fullName: "Daniel Kim" },
  { clerkId: "demo_mentor_nora", email: "nora.demo@linku.local", role: "MENTOR", fullName: "Nora Chen" },
  { clerkId: "demo_mentor_liam", email: "liam.demo@linku.local", role: "MENTOR", fullName: "Liam Carter" }
] as const;

const DEMO_CHANNELS = [
  { name: "Harvard Applicants", slug: "harvard-applicants", universityName: "Harvard University" },
  { name: "Yale Journey", slug: "yale-journey", universityName: "Yale University" },
  { name: "Princeton Bound", slug: "princeton-bound", universityName: "Princeton University" },
  { name: "Columbia Network", slug: "columbia-network", universityName: "Columbia University" },
  { name: "UPenn Community", slug: "upenn-community", universityName: "University of Pennsylvania" }
] as const;

export async function ensureDemoFeedData() {
  const [channelCount, postCount] = await Promise.all([prisma.channel.count(), prisma.post.count()]);
  if (channelCount > 0 || postCount > 0) return;

  const seededUsers = await Promise.all(
    DEMO_USERS.map(async (demoUser) => {
      const user = await prisma.user.upsert({
        where: { clerkId: demoUser.clerkId },
        update: {},
        create: {
          clerkId: demoUser.clerkId,
          email: demoUser.email,
          role: demoUser.role
        }
      });

      if (demoUser.role === "STUDENT") {
        await prisma.studentProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            fullName: demoUser.fullName,
            country: "United States",
            gpa: 3.9,
            intendedMajor: "Computer Science",
            targetUniversities: ["Harvard University", "Yale University"],
            achievements: ["Student Council", "Research Internship"],
            bio: "Focused on building strong applications and finding peer support."
          }
        });
      }

      if (demoUser.role === "MENTOR") {
        await prisma.mentorProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            fullName: demoUser.fullName,
            country: "United States",
            university: demoUser.fullName.includes("Nora") ? "Harvard University" : "Columbia University",
            major: "Computer Science",
            graduationYear: 2023,
            acceptedUniversities: ["Harvard University", "Yale University", "Princeton University"],
            scholarships: ["Merit Award"],
            hourlyRateCents: 12000,
            availableTimeSlots: [],
            verificationStatus: "APPROVED",
            verificationBadge: true,
            bio: "I help students craft stronger narratives for competitive admissions."
          }
        });
      }

      return { ...demoUser, id: user.id };
    })
  );

  const channels = await Promise.all(
    DEMO_CHANNELS.map((channel) =>
      prisma.channel.upsert({
        where: { slug: channel.slug },
        update: {},
        create: {
          name: channel.name,
          slug: channel.slug,
          universityName: channel.universityName,
          description: `Community for ${channel.universityName} applicants and mentors.`,
          createdById: seededUsers[0].id
        }
      })
    )
  );

  await Promise.all(
    channels.map((channel) =>
      prisma.channelMember.createMany({
        data: seededUsers.map((user) => ({
          channelId: channel.id,
          userId: user.id
        })),
        skipDuplicates: true
      })
    )
  );

  await prisma.post.createMany({
    data: [
      {
        authorId: seededUsers[0].id,
        title: "How early did you start your Harvard supplemental drafts?",
        body: "I am planning my timeline and curious how everyone is pacing essays vs activities.",
        upvotes: 24
      },
      {
        authorId: seededUsers[1].id,
        title: "Profile review swap?",
        body: "Anyone open to a constructive profile exchange this weekend?",
        upvotes: 18
      },
      {
        authorId: seededUsers[2].id,
        channelId: channels[0].id,
        title: "Harvard interview prep checklist",
        body: "Keep answers specific, practice 4 concise stories, and show intellectual curiosity.",
        upvotes: 41
      },
      {
        authorId: seededUsers[3].id,
        channelId: channels[3].id,
        title: "Columbia essay structure that worked",
        body: "Frame your personal growth with concrete moments; avoid generic NYC references.",
        upvotes: 36
      },
      {
        authorId: seededUsers[0].id,
        channelId: channels[2].id,
        title: "Princeton engineering applicants thread",
        body: "Drop intended concentration and EC themes so we can compare positioning.",
        upvotes: 15
      }
    ]
  });
}
