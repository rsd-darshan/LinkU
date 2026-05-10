import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiProfileClient } from "@/components/linku-ai/profile-client";

export const dynamic = "force-dynamic";

export default async function LinkUAiProfilePage() {
  const user = await requireUserRedirect();

  const [profile, lors] = await Promise.all([
    prisma.userGlobalProfile.findUnique({ where: { userId: user.id } }),
    prisma.lor.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const serializedProfile = profile
    ? {
        ...profile,
        gpa: profile.gpa != null ? Number(profile.gpa) : null,
      }
    : null;

  return (
    <section className="pt-0" aria-label="Global profile">
      <LinkUAiProfileClient initialProfile={serializedProfile} initialLors={lors} />
    </section>
  );
}
