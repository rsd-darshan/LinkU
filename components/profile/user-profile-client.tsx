"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type UserProfileData = {
  id: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  createdAt: string;
  studentProfile: {
    fullName: string;
    country: string;
    gpa: number;
    intendedMajor: string;
    targetUniversities: string[];
    bio: string | null;
    achievements: string[];
  } | null;
  mentorProfile: {
    fullName: string;
    country: string;
    university: string;
    major: string;
    graduationYear: number;
    acceptedUniversities: string[];
    bio: string | null;
    verificationBadge: boolean;
  } | null;
  connectionStatus: "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "SELF";
  _count: {
    posts: number;
    sentConnectionRequests: number;
    receivedConnectionRequests: number;
  };
  posts: Array<{
    id: string;
    title: string;
    body: string;
    mediaUrls: string[];
    createdAt: string;
    upvotes: number;
    channel: {
      id: string;
      slug: string;
      name: string;
      universityName: string | null;
    } | null;
    commentCount: number;
  }>;
};

type UserProfileClientProps = {
  userId: string;
  initialData: UserProfileData;
};

export function UserProfileClient({ userId, initialData }: UserProfileClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = (await response.json()) as { user?: UserProfileData; error?: string };
      if (response.ok && data.user) {
        setUser((prev) => ({ ...prev, connectionStatus: data.user!.connectionStatus }));
      }
    } catch {
      // Silently fail - connection status refresh is not critical
    }
  }, [userId]);

  async function sendConnectionRequest() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId })
      });
      const data = (await response.json()) as { error?: string; connection?: { id: string } };
      if (!response.ok) {
        // If connection already exists, refresh status instead of showing error
        if (data.error?.includes("already exists")) {
          await refreshConnectionStatus();
          return;
        }
        throw new Error(data.error || "Failed to send request");
      }
      setUser((prev) => ({ ...prev, connectionStatus: "PENDING" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshConnectionStatus();
  }, [refreshConnectionStatus]);

  const profile = user.studentProfile || user.mentorProfile;
  const fullName = user.studentProfile?.fullName || user.mentorProfile?.fullName || user.email.split("@")[0];

  return (
    <div className="page-content space-y-7">
      {/* Profile Header */}
      <div className="card-app relative overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700"></div>
        <div className="relative px-6 pb-6">
          <div className="-mt-16 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                  {user.connectionStatus === "ACCEPTED" && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Connected
                    </span>
                  )}
                  {user.mentorProfile?.verificationBadge && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {user.role === "STUDENT" ? "Student" : user.role === "MENTOR" ? "Mentor" : "Admin"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pb-2">
              {user.connectionStatus === "NONE" && (
                <Button onClick={sendConnectionRequest} disabled={loading}>
                  {loading ? "Connecting..." : "Connect"}
                </Button>
              )}
              {user.connectionStatus === "PENDING" && (
                <span className="rounded-md bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-700">
                  Request Pending
                </span>
              )}
              {user.connectionStatus === "ACCEPTED" && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/messages?userId=${userId}`)}
                  >
                    Message
                  </Button>
                </div>
              )}
              {user.connectionStatus === "DECLINED" && (
                <span className="rounded-md bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-700">
                  Declined
                </span>
              )}
              {user.connectionStatus === "SELF" && (
                <Button variant="secondary" onClick={() => router.push("/profile")}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          {profile && (
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.studentProfile && (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.studentProfile.intendedMajor}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.studentProfile.country}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GPA</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {typeof user.studentProfile.gpa === "number"
                        ? user.studentProfile.gpa.toFixed(2)
                        : Number(user.studentProfile.gpa).toFixed(2)}
                    </p>
                  </div>
                  {user.studentProfile.targetUniversities.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 md:col-span-2 lg:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target Universities</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.studentProfile.targetUniversities.map((uni, idx) => (
                          <span key={idx} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                            {uni}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.studentProfile.achievements.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 md:col-span-2 lg:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Achievements</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.studentProfile.achievements.map((achievement, idx) => (
                          <span key={idx} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {user.mentorProfile && (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">University</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.mentorProfile.university}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.mentorProfile.major}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.mentorProfile.country}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 transition-colors duration-normal hover:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Graduation Year</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.mentorProfile.graduationYear}</p>
                  </div>
                  {user.mentorProfile.acceptedUniversities.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3.5 md:col-span-2 lg:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accepted Universities</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.mentorProfile.acceptedUniversities.map((uni, idx) => (
                          <span key={idx} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                            {uni}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {profile?.bio && (
            <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50/90 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* Posts Section */}
      <div className="card-app p-0">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Posts <span className="text-sm font-normal text-slate-500">({user._count.posts})</span>
          </h2>
        </div>
        <div className="p-6">
          {user.posts.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">No posts yet</p>
              <p className="mt-1 text-sm text-slate-600">This user hasn&apos;t shared any posts.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="focus-ring group block overflow-hidden rounded-xl border border-slate-200 bg-white/90 transition duration-normal hover:-translate-y-px hover:border-brand-300 hover:shadow-md"
                >
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      {/\.(mp4|webm|mov)$/i.test(post.mediaUrls[0]) ? (
                        <video src={post.mediaUrls[0]} className="h-full w-full object-cover" muted />
                      ) : (
                        <Image
                          src={post.mediaUrls[0]}
                          alt={post.title}
                          fill
                          className="object-cover transition duration-normal group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          unoptimized
                        />
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-semibold text-slate-900 transition-colors duration-normal group-hover:text-brand-600">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.body}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {post.channel && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                            /{post.channel.slug}
                          </span>
                        )}
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          {post.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
