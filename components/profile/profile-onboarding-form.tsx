"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Role = "STUDENT" | "MENTOR" | "ADMIN";

type ProfilePayload = {
  user: {
    id: string;
    role: Role;
    email: string;
  };
  studentProfile: {
    fullName: string;
    country: string;
    gpa: string;
    satScore: number | null;
    actScore: number | null;
    intendedMajor: string;
    targetUniversities: string[];
    bio: string | null;
    achievements: string[];
    isVisible: boolean;
  } | null;
  mentorProfile: {
    fullName: string;
    country: string;
    university: string;
    major: string;
    graduationYear: number;
    acceptedUniversities: string[];
    scholarships: string[];
    hourlyRateCents: number;
    availableTimeSlots: string[];
    bio: string | null;
  } | null;
  posts: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    channel: { id: string; slug: string; name: string; universityName: string | null } | null;
  }>;
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ProfileOnboardingForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("STUDENT");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [gpa, setGpa] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [intendedMajor, setIntendedMajor] = useState("");
  const [targetUniversitiesCsv, setTargetUniversitiesCsv] = useState("");
  const [achievementsCsv, setAchievementsCsv] = useState("");
  const [bio, setBio] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [acceptedUniversitiesCsv, setAcceptedUniversitiesCsv] = useState("");
  const [scholarshipsCsv, setScholarshipsCsv] = useState("");
  const [hourlyRateUsd, setHourlyRateUsd] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotDraft, setSlotDraft] = useState("");
  const [pastPosts, setPastPosts] = useState<ProfilePayload["posts"]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/profile", { method: "GET" });
        const data = (await response.json()) as ProfilePayload;
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        setRole(data.user.role || "STUDENT");
        setPastPosts(data.posts || []);
        if (data.studentProfile) {
          setFullName(data.studentProfile.fullName || "");
          setCountry(data.studentProfile.country || "");
          setGpa(data.studentProfile.gpa || "");
          setSatScore(data.studentProfile.satScore ? String(data.studentProfile.satScore) : "");
          setActScore(data.studentProfile.actScore ? String(data.studentProfile.actScore) : "");
          setIntendedMajor(data.studentProfile.intendedMajor || "");
          setTargetUniversitiesCsv(data.studentProfile.targetUniversities.join(", "));
          setAchievementsCsv(data.studentProfile.achievements.join(", "));
          setBio(data.studentProfile.bio || "");
          setIsVisible(data.studentProfile.isVisible);
        }
        if (data.mentorProfile) {
          setFullName(data.mentorProfile.fullName || "");
          setCountry(data.mentorProfile.country || "");
          setUniversity(data.mentorProfile.university || "");
          setMajor(data.mentorProfile.major || "");
          setGraduationYear(String(data.mentorProfile.graduationYear || ""));
          setAcceptedUniversitiesCsv(data.mentorProfile.acceptedUniversities.join(", "));
          setScholarshipsCsv(data.mentorProfile.scholarships.join(", "));
          setHourlyRateUsd(String((data.mentorProfile.hourlyRateCents || 0) / 100));
          setAvailableSlots(data.mentorProfile.availableTimeSlots || []);
          setBio(data.mentorProfile.bio || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const canSubmit = useMemo(() => {
    if (!fullName || !country) return false;
    if (role === "STUDENT") return Boolean(intendedMajor);
    if (role === "MENTOR") return Boolean(university && major && graduationYear && hourlyRateUsd);
    return true;
  }, [country, fullName, graduationYear, hourlyRateUsd, intendedMajor, major, role, university]);

  const graduationYearOptions = useMemo(() => {
    const start = new Date().getFullYear() - 5;
    const end = 2100;
    const years: string[] = [];
    for (let year = end; year >= start; year -= 1) {
      years.push(String(year));
    }
    return years;
  }, []);

  function addAvailabilitySlot() {
    if (!slotDraft) return;
    const iso = new Date(slotDraft).toISOString();
    setAvailableSlots((prev) => {
      if (prev.includes(iso)) return prev;
      return [...prev, iso].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    });
    setSlotDraft("");
  }

  function removeAvailabilitySlot(slot: string) {
    setAvailableSlots((prev) => prev.filter((item) => item !== slot));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName,
          country,
          gpa: gpa ? Number(gpa) : undefined,
          satScore: satScore ? Number(satScore) : undefined,
          actScore: actScore ? Number(actScore) : undefined,
          intendedMajor,
          targetUniversities: splitCsv(targetUniversitiesCsv),
          bio,
          achievements: splitCsv(achievementsCsv),
          isVisible,
          university,
          major,
          graduationYear: graduationYear ? Number(graduationYear) : undefined,
          acceptedUniversities: splitCsv(acceptedUniversitiesCsv),
          scholarships: splitCsv(scholarshipsCsv),
          hourlyRateCents: hourlyRateUsd ? Math.round(Number(hourlyRateUsd) * 100) : undefined,
          availableTimeSlots: availableSlots
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading profile...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="card-app space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-slate-700">Role</span>
          <select
            className="input-app"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="STUDENT">Student</option>
            <option value="MENTOR">Mentor</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-slate-700">Full name</span>
          <input
            className="input-app"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-slate-700">Country</span>
          <input
            className="input-app"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-slate-700">Bio</span>
          <textarea
            className="input-app"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
      </div>

      {role === "STUDENT" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Intended major</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={intendedMajor}
              onChange={(e) => setIntendedMajor(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">GPA</span>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">SAT (optional)</span>
            <input
              type="number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={satScore}
              onChange={(e) => setSatScore(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">ACT (optional)</span>
            <input
              type="number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={actScore}
              onChange={(e) => setActScore(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Target universities (comma-separated)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={targetUniversitiesCsv}
              onChange={(e) => setTargetUniversitiesCsv(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Achievements (comma-separated)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={achievementsCsv}
              onChange={(e) => setAchievementsCsv(e.target.value)}
            />
          </label>
          <label className="inline-flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
            <span className="text-sm text-slate-700">Profile visible to other students</span>
          </label>
        </div>
      ) : null}

      {role === "MENTOR" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">University</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Major</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Graduation year</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
            >
              <option value="">Select year</option>
              {graduationYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Hourly rate (USD)</span>
            <input
              type="number"
              min={10}
              step={1}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={hourlyRateUsd}
              onChange={(e) => setHourlyRateUsd(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Accepted universities (comma-separated)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={acceptedUniversitiesCsv}
              onChange={(e) => setAcceptedUniversitiesCsv(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Scholarships (comma-separated)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={scholarshipsCsv}
              onChange={(e) => setScholarshipsCsv(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Available slots</span>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={slotDraft}
                onChange={(e) => setSlotDraft(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addAvailabilitySlot}>
                Add
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {availableSlots.map((slot) => (
                <div
                  key={slot}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{typeof window !== 'undefined' ? new Date(slot).toLocaleString() : ''}</span>
                  <Button type="button" variant="secondary" onClick={() => removeAvailabilitySlot(slot)}>
                    Remove
                  </Button>
                </div>
              ))}
              {availableSlots.length === 0 ? (
                <p className="text-xs text-slate-500">No slots added yet.</p>
              ) : null}
            </div>
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" disabled={!canSubmit || saving}>
        {saving ? "Saving..." : "Save Profile"}
      </Button>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Past posts</h2>
        {pastPosts.length === 0 ? (
          <p className="text-sm text-slate-600">No posts yet.</p>
        ) : (
          pastPosts.map((post) => (
            <article key={post.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                {typeof window !== 'undefined' ? (post.channel ? post.channel.name : "Independent") + " - " + new Date(post.createdAt).toLocaleString() : ''}
              </p>
              <p className="mt-1 font-medium text-slate-900">{post.title}</p>
              <p className="mt-1 text-sm text-slate-700">{post.body}</p>
            </article>
          ))
        )}
      </section>
    </form>
  );
}
