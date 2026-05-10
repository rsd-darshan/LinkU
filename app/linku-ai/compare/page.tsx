import { requireUserRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkUAiCompareClient } from "@/components/linku-ai/compare-client";

export const dynamic = "force-dynamic";

type Peer = { id: string; email: string; fullName: string };

export default async function LinkUAiComparePage() {
  const user = await requireUserRedirect();

  const [connections, allStudents, universities] = await Promise.all([
    prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { receiverId: user.id }],
      },
      select: {
        requesterId: true,
        receiverId: true,
        requester: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { fullName: true } },
            mentorProfile: { select: { fullName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { fullName: true } },
            mentorProfile: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        email: true,
        studentProfile: { select: { fullName: true } },
        mentorProfile: { select: { fullName: true } },
      },
      take: 100,
    }),
    prisma.university.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  function displayName(u: { email: string; studentProfile?: { fullName: string } | null; mentorProfile?: { fullName: string } | null }) {
    return u.studentProfile?.fullName ?? u.mentorProfile?.fullName ?? u.email;
  }
  const peerIds = new Set<string>();
  const peers: Peer[] = [];
  for (const c of connections) {
    const other = c.requesterId === user.id ? c.receiver : c.requester;
    if (other.role === "STUDENT" && other.id !== user.id && !peerIds.has(other.id)) {
      peerIds.add(other.id);
      peers.push({ id: other.id, email: other.email, fullName: displayName(other) });
    }
  }
  const users: Peer[] = allStudents.map((u) => ({ id: u.id, email: u.email, fullName: displayName(u) }));

  return (
    <section className="page-content" aria-labelledby="compare-title">
      <div className="page-header card-app">
        <h1 id="compare-title" className="page-title">
          Compare two users
        </h1>
        <p className="page-description">
          Compare yourself with a peer at a university. User A is you; choose a connection as peer (or any student if you have no connections). Comparison uses global profiles and supplements for that university.
        </p>
      </div>
      <LinkUAiCompareClient
        currentUserId={user.id}
        users={users}
        peerUsers={peers.length > 0 ? peers : undefined}
        universities={universities}
      />
    </section>
  );
}
