"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StateMessage } from "@/components/ui/state-message";

type StudentRow = {
  user: { id: string; email: string };
  fullName: string;
  country: string;
  intendedMajor: string;
  targetUniversities: string[];
  bio: string | null;
};

type ConnectionRow = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  requester: {
    id: string;
    studentProfile: { fullName: string; intendedMajor: string; country: string } | null;
  };
  receiver: {
    id: string;
    studentProfile: { fullName: string; intendedMajor: string; country: string } | null;
  };
};

type CurrentUser = {
  id: string;
};

export function NetworkingClient() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [major, setMajor] = useState("");
  const [country, setCountry] = useState("");
  const [targetUniversity, setTargetUniversity] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (major) params.set("major", major);
    if (country) params.set("country", country);
    if (targetUniversity) params.set("targetUniversity", targetUniversity);
    return params.toString();
  }, [country, major, targetUniversity]);

  async function loadConnections() {
    const response = await fetch("/api/connections");
    const data = (await response.json()) as { connections: ConnectionRow[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load connections");
    setConnections(data.connections || []);
  }

  async function loadStudents() {
    const response = await fetch(`/api/students/discover${query ? `?${query}` : ""}`);
    const data = (await response.json()) as { students: StudentRow[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load students");
    setStudents(data.students || []);
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileRes = await fetch("/api/profile");
        const profile = (await profileRes.json()) as { user?: CurrentUser; error?: string };
        if (!profileRes.ok || !profile.user) throw new Error(profile.error || "Failed to load current user");
        setCurrentUser(profile.user);
        await Promise.all([loadStudents(), loadConnections()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load networking data");
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters() {
    setError(null);
    try {
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply filters");
    }
  }

  const connectionMap = useMemo(() => {
    const map = new Map<string, ConnectionRow>();
    connections.forEach((connection) => {
      const otherUserId = connection.requesterId === currentUser?.id ? connection.receiverId : connection.requesterId;
      map.set(otherUserId, connection);
    });
    return map;
  }, [connections, currentUser?.id]);
  const incomingPending = useMemo(
    () =>
      connections.filter(
        (connection) => connection.status === "PENDING" && connection.receiverId === currentUser?.id
      ),
    [connections, currentUser?.id]
  );

  async function sendRequest(receiverId: string) {
    setError(null);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to send request");
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  async function respond(connectionId: string, action: "ACCEPTED" | "DECLINED") {
    setError(null);
    try {
      const response = await fetch("/api/connections/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to update request");
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request");
    }
  }

  return (
    <div className="page-content space-y-5">
      {loading ? (
        <div className="space-y-4">
          <div className="card-app h-24 animate-pulse rounded-card bg-slate-100" />
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-app h-32 animate-pulse rounded-card bg-slate-100" />
            ))}
          </div>
        </div>
      ) : null}
      {error && !loading ? (
        <StateMessage variant="error" title="Couldn't load connections" description={error} />
      ) : null}
      {!loading ? (
      <>
      <section className="card-app" aria-labelledby="filters-heading">
        <h2 id="filters-heading" className="text-title-sm text-slate-900">Find people</h2>
        <p className="mt-1 text-caption text-slate-500">Filter by major, country, or target university.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="networking-major" className="mb-1.5 block text-body-sm font-medium text-slate-700">Major</label>
            <input
              id="networking-major"
              className="input-app"
              placeholder="e.g. Computer Science"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="networking-country" className="mb-1.5 block text-body-sm font-medium text-slate-700">Country</label>
            <input
              id="networking-country"
              className="input-app"
              placeholder="e.g. United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="networking-university" className="mb-1.5 block text-body-sm font-medium text-slate-700">Target university</label>
            <input
              id="networking-university"
              className="input-app"
              placeholder="e.g. MIT"
              value={targetUniversity}
              onChange={(e) => setTargetUniversity(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => void applyFilters()}>
            Apply filters
          </Button>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="discover-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="discover-heading" className="text-title-sm text-slate-900">Discover students</h2>
          <span className="text-caption text-slate-500">
            {students.filter((s) => s.user.id !== currentUser?.id).length} result{students.filter((s) => s.user.id !== currentUser?.id).length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {students
            .filter((student) => student.user.id !== currentUser?.id)
            .map((student) => {
              const connection = connectionMap.get(student.user.id);
              const isIncomingPending =
                connection?.status === "PENDING" && connection.receiverId === currentUser?.id;
              return (
                <article key={student.user.id} className="card-app flex flex-col transition-shadow duration-normal hover:shadow-card-hover">
                  <div className="flex gap-4">
                    <Link href={`/profile/${student.user.id}`} className="flex-shrink-0 rounded-full ring-2 ring-transparent focus-visible:ring-brand-500 focus-visible:ring-offset-2">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-sm">
                        {student.fullName.charAt(0).toUpperCase()}
                      </span>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile/${student.user.id}`} className="text-body font-semibold text-slate-900 hover:text-brand-600 transition">
                        {student.fullName}
                      </Link>
                      <p className="mt-1 text-body-sm text-slate-600">
                        {student.intendedMajor} · {student.country}
                      </p>
                      {student.targetUniversities.length > 0 && (
                        <p className="mt-1 text-caption text-slate-500 line-clamp-1">{student.targetUniversities.join(", ")}</p>
                      )}
                      {student.bio ? (
                        <p className="mt-2 text-body-sm text-slate-700 line-clamp-2">{student.bio}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {!connection ? (
                      <Button type="button" onClick={() => void sendRequest(student.user.id)}>
                        Connect
                      </Button>
                    ) : connection.status === "ACCEPTED" ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-body-sm font-medium text-emerald-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Connected
                        </span>
                        <Link href={`/messages?userId=${student.user.id}`}>
                          <Button type="button" variant="secondary">Message</Button>
                        </Link>
                      </>
                    ) : isIncomingPending ? (
                      <>
                        <Button type="button" onClick={() => void respond(connection.id, "ACCEPTED")}>
                          Accept
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => void respond(connection.id, "DECLINED")}>
                          Decline
                        </Button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-body-sm font-medium text-amber-800">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden /> Request pending
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
        {students.filter((student) => student.user.id !== currentUser?.id).length === 0 ? (
          <div className="card-app py-12">
            <StateMessage variant="empty" title="No students found" description="Try adjusting your filters or check back later." />
          </div>
        ) : null}
      </section>

      <section className="card-app" aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-title-sm text-slate-900">Pending connection requests</h2>
        <p className="mt-1 text-caption text-slate-500">Accept or decline requests from people who want to connect.</p>
        <div className="mt-4 space-y-3">
          {incomingPending.map((connection) => {
            const requesterName = connection.requester.studentProfile?.fullName || "User";
            const major = connection.requester.studentProfile?.intendedMajor || "";
            const country = connection.requester.studentProfile?.country || "";
            return (
              <article
                key={connection.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-slate-200/50 bg-white/65 p-4 transition hover:bg-white/85 backdrop-blur-sm"
              >
                <Link href={`/profile/${connection.requesterId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">
                    {requesterName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 hover:text-brand-600 transition">{requesterName}</p>
                    <p className="text-caption text-slate-500">
                      {[major, country].filter(Boolean).join(" · ") || "Wants to connect with you"}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" onClick={() => void respond(connection.id, "ACCEPTED")}>
                    Accept
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void respond(connection.id, "DECLINED")}>
                    Decline
                  </Button>
                </div>
              </article>
            );
          })}
          {incomingPending.length === 0 ? (
            <div className="rounded-card border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <p className="text-body-sm text-slate-600">No pending requests right now.</p>
              <p className="mt-1 text-caption text-slate-500">When someone sends you a request, it will appear here.</p>
            </div>
          ) : null}
        </div>
      </section>
      </>
      ) : null}
    </div>
  );
}
