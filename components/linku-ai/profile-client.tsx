"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileSectionSidebar } from "@/components/linku-ai/profile-section-sidebar";

const PROFILE_SECTIONS = ["academic", "activities", "essay", "lors"] as const;
type SectionId = (typeof PROFILE_SECTIONS)[number];

function useProfileSectionFromHash(): SectionId {
  const [section, setSection] = useState<SectionId>("academic");
  useEffect(() => {
    const read = () => {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1).toLowerCase() : "";
      setSection(PROFILE_SECTIONS.includes(hash as SectionId) ? (hash as SectionId) : "academic");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return section;
}

type Profile = {
  id: string;
  gpa: number | null;
  sat: number | null;
  schoolContext: string | null;
  ecasJson: unknown;
  honorsJson: unknown;
  awardsJson: unknown;
  otherScoresJson?: unknown;
  intendedMajor: string | null;
  personalEssay: string | null;
  lorRating: number | null;
  hooksJson: unknown;
  resumeUrl: string | null;
} | null;

type OtherScoreItem = { name: string; value: string };

type Lor = {
  id: string;
  teacherName: string;
  strengthRating: number;
  relationshipRating: number;
  credibilityRating: number;
};

function arr(x: unknown): string[] {
  return Array.isArray(x) ? (x as string[]) : [];
}

function parseEcasFromProfile(profile: Profile | null): ActivityHonorItem[] {
  const a = arr(profile?.ecasJson);
  return a.length > 0 ? a.map(parseItem) : [];
}

function parseHonorsFromProfile(profile: Profile | null): ActivityHonorItem[] {
  const h = arr(profile?.honorsJson);
  return h.length > 0 ? h.map(parseItem) : [];
}

function parseOtherScoresFromProfile(profile: Profile | null): OtherScoreItem[] {
  const raw = profile?.otherScoresJson;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is { name?: unknown; value?: unknown } => x != null && typeof x === "object")
    .map((x) => ({ name: String(x.name ?? "").trim(), value: String(x.value ?? "").trim() }))
    .filter((x) => x.name !== "" || x.value !== "");
}

const MAX_ACTIVITIES = 10;
const MAX_HONORS = 10;

type ActivityHonorItem = { heading: string; description: string };

function parseItem(s: string): ActivityHonorItem {
  const i = s.indexOf("\n");
  if (i >= 0) return { heading: s.slice(0, i), description: s.slice(i + 1) };
  return { heading: s, description: "" };
}

function serializeItem(item: ActivityHonorItem): string {
  return item.description ? `${item.heading}\n${item.description}` : item.heading;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" className="animate-spin origin-center" style={{ animationDuration: "0.8s" }} />
    </svg>
  );
}

/* Form tokens — full-width layout; clear type scale; 44px touch targets; motion-reduce */
const form = {
  section:
    "pb-10 sm:pb-12 space-y-8 sm:space-y-10 border-b border-slate-200/70 last:border-b-0 last:pb-0",
  sectionHeader: "space-y-1",
  sectionTitle: "text-title font-semibold text-slate-900 tracking-tight",
  sectionDesc: "text-body-sm text-slate-500 max-w-2xl",
  fieldGroup: "space-y-6 sm:space-y-8",
  field: "block space-y-2",
  label: "text-body-sm font-medium text-slate-700",
  input:
    "block w-full min-h-[44px] rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body text-slate-900 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-fast ease-smooth disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
  textarea:
    "block w-full rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body text-slate-900 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-fast ease-smooth resize-y min-h-[120px] sm:min-h-[140px] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
  helper: "text-caption text-slate-500",
  error: "text-caption text-red-600",
  card:
    "rounded-input border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm transition-[box-shadow,transform,border-color] duration-normal ease-smooth hover:-translate-y-px hover:shadow-md hover:border-slate-300/70",
  subsectionTitle: "text-body font-semibold text-slate-800",
  emptyState: "py-10 sm:py-12 text-center text-body-sm text-slate-500 rounded-input border border-dashed border-slate-200 bg-slate-50/50",
  alertError:
    "rounded-input border border-red-200/80 bg-red-50/95 px-4 py-3.5 text-body-sm text-red-800 flex items-center gap-3 min-h-[48px] animate-fade-in-up motion-reduce:animate-none",
  alertSuccess:
    "rounded-input border border-emerald-200/80 bg-emerald-50/95 px-4 py-3.5 text-body-sm text-emerald-800 flex items-center gap-3 min-h-[48px] animate-fade-in-up motion-reduce:animate-none",
  btnPrimary:
    "focus-ring inline-flex min-h-[44px] items-center justify-center gap-2 rounded-input bg-brand-600 px-5 py-3 text-body font-medium text-white transition-colors duration-normal ease-smooth hover:bg-brand-700 active:bg-brand-700 motion-reduce:transition-none disabled:opacity-60 disabled:cursor-not-allowed",
  btnSecondary:
    "focus-ring inline-flex min-h-[44px] items-center justify-center gap-2 rounded-input border border-slate-200 bg-white px-4 py-2.5 text-body-sm font-medium text-slate-700 transition-colors duration-normal ease-smooth hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 motion-reduce:transition-none disabled:opacity-50",
  btnDanger:
    "focus-ring inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-white text-red-600 transition-colors duration-normal ease-smooth hover:bg-red-50 active:bg-red-100 motion-reduce:transition-none disabled:opacity-50",
  btnDangerText:
    "focus-ring inline-flex min-h-[44px] items-center justify-center gap-2 rounded-input px-3.5 py-2.5 text-body-sm font-medium text-red-600 transition-colors duration-normal ease-smooth hover:bg-red-50 hover:text-red-700 active:bg-red-100 motion-reduce:transition-none disabled:opacity-50",
  btnIcon:
    "focus-ring inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-normal ease-smooth hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 motion-reduce:transition-none disabled:opacity-50",
} as const;

export function LinkUAiProfileClient({
  initialProfile,
  initialLors,
}: {
  initialProfile: Profile;
  initialLors: Lor[];
}) {
  const [, setProfile] = useState(initialProfile);
  const [lors] = useState(initialLors);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [essayAnalysis, setEssayAnalysis] = useState<{
    essayScore0_100: number;
    coherence: number;
    narrativeDepth: number;
    originality: number;
    alignment: number;
  } | null>(null);

  const [gpa, setGpa] = useState(initialProfile?.gpa?.toString() ?? "");
  const [sat, setSat] = useState(initialProfile?.sat?.toString() ?? "");
  const [schoolContext, setSchoolContext] = useState(initialProfile?.schoolContext ?? "");
  const [activities, setActivities] = useState<ActivityHonorItem[]>(() => parseEcasFromProfile(initialProfile));
  const [honors, setHonors] = useState<ActivityHonorItem[]>(() => parseHonorsFromProfile(initialProfile));
  const [otherScores, setOtherScores] = useState<OtherScoreItem[]>(() => parseOtherScoresFromProfile(initialProfile));
  const [intendedMajor, setIntendedMajor] = useState(initialProfile?.intendedMajor ?? "");
  const [personalEssay, setPersonalEssay] = useState(initialProfile?.personalEssay ?? "");
  const [lorRating, setLorRating] = useState(initialProfile?.lorRating?.toString() ?? "");
  const [resumeUrl, setResumeUrl] = useState(initialProfile?.resumeUrl ?? "");
  const activeSection = useProfileSectionFromHash();
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);
  const [editingHonorIndex, setEditingHonorIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(false), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/linku-ai/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpa: gpa === "" ? null : parseFloat(gpa),
          sat: sat === "" ? null : parseInt(sat, 10),
          schoolContext: schoolContext || null,
          ecasJson: activities.map(serializeItem).map((s) => s.trim()).filter(Boolean),
          honorsJson: honors.map(serializeItem).map((s) => s.trim()).filter(Boolean),
          awardsJson: [],
          otherScoresJson: otherScores.filter((x) => x.name.trim() || x.value.trim()).map((x) => ({ name: x.name.trim() || "Other", value: x.value.trim() })),
          intendedMajor: intendedMajor || null,
          personalEssay: personalEssay || null,
          lorRating: lorRating === "" ? null : parseInt(lorRating, 10),
          hooksJson: [],
          resumeUrl: resumeUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setProfile(data);
      setActivities(parseEcasFromProfile(data));
      setHonors(parseHonorsFromProfile(data));
      setOtherScores(parseOtherScoresFromProfile(data));
      setEditingActivityIndex(null);
      setEditingHonorIndex(null);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function analyzePersonalEssay() {
    const text = personalEssay.trim();
    if (!text) {
      setAnalysisError("Add some essay text first.");
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    setEssayAnalysis(null);
    try {
      const res = await fetch("/api/linku-ai/essay/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayType: "PERSONAL", content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setEssayAnalysis({
        essayScore0_100: data.essayScore0_100,
        coherence: data.coherence,
        narrativeDepth: data.narrativeDepth,
        originality: data.originality,
        alignment: data.alignment,
      });
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function uploadResume(file: File) {
    setResumeUploading(true);
    setResumeUploadError(null);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const presign = (await presignRes.json()) as { uploadUrl?: string; publicUrl?: string | null; error?: string };
      if (!presignRes.ok || !presign.uploadUrl) {
        throw new Error(presign.error || "Upload unavailable");
      }
      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const url = presign.publicUrl ?? null;
      if (url) setResumeUrl(url);
      else throw new Error("Upload URL not configured; paste a link instead.");
    } catch (e) {
      setResumeUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setResumeUploading(false);
    }
  }

  return (
    <div className="card-app flex w-full flex-col gap-6 p-4 sm:gap-7 sm:p-6">
      <ProfileSectionSidebar />
      <div className="min-w-0 flex w-full flex-1 flex-col gap-6 sm:gap-9">
        {error && (
          <div className={form.alertError} role="alert" aria-live="assertive">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700 text-caption font-bold" aria-hidden>!</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={form.alertSuccess} role="status" aria-live="polite">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 font-bold" aria-hidden>✓</span>
            <span>Profile saved successfully.</span>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-0 rounded-input border border-slate-200/60 bg-white/75 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
        <div
          id="academic"
          className={activeSection === "academic" ? "animate-fade-in-up motion-reduce:animate-none" : "hidden"}
        >
      <section className={form.section} aria-labelledby="academic-heading" aria-describedby="academic-desc">
        <header className={form.sectionHeader}>
          <h2 id="academic-heading" className={form.sectionTitle}>Grades & scores</h2>
          <p id="academic-desc" className={form.sectionDesc}>Core academic metrics schools use for evaluation.</p>
        </header>

        <div className={form.card}>
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-6">
              <label htmlFor="profile-gpa" className={form.field}>
                <span className={form.label}>GPA (0-4.5)</span>
                <input
                  id="profile-gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.5"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 3.8"
                  className={form.input}
                  aria-describedby="gpa-helper"
                />
                <span id="gpa-helper" className={form.helper}>
                  Unweighted or weighted, depending on your school.
                </span>
              </label>

              <label htmlFor="profile-sat" className={form.field}>
                <span className={form.label}>SAT (400-1600)</span>
                <input
                  id="profile-sat"
                  type="number"
                  min="400"
                  max="1600"
                  value={sat}
                  onChange={(e) => setSat(e.target.value)}
                  placeholder="e.g. 1450"
                  className={form.input}
                  aria-describedby="sat-helper"
                />
                <span id="sat-helper" className={form.helper}>
                  Total score. Leave blank if not taken.
                </span>
              </label>

              <label htmlFor="profile-intended-major" className={form.field}>
                <span className={form.label}>Intended major</span>
                <input
                  id="profile-intended-major"
                  type="text"
                  value={intendedMajor}
                  onChange={(e) => setIntendedMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className={form.input}
                />
                <span className={form.helper + " invisible"} aria-hidden="true">
                  —
                </span>
              </label>
            </div>

            <label className={form.field + " space-y-1 sm:space-y-2"}>
              <span className={form.label}>School context</span>
              <textarea
                id="profile-school-context"
                value={schoolContext}
                onChange={(e) => setSchoolContext(e.target.value)}
                rows={3}
                placeholder="e.g. Competitive public school, 400 in graduating class"
                className={form.textarea}
              />
              <span className={form.helper}>
                Brief context about your high school (size, rigor, etc.).
              </span>
            </label>

            <div className={form.fieldGroup}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={form.subsectionTitle}>
                  Other scores (AP, subject tests, etc.)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setOtherScores((prev) => [...prev, { name: "", value: "" }])
                  }
                  className={form.btnSecondary + " shrink-0"}
                  aria-label="Add score"
                >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                  Add score
                </button>
              </div>
              {otherScores.length === 0 ? (
                <p className={form.emptyState}>
                  Add AP scores, SAT Subject Tests, or other exam results.
                </p>
              ) : (
                <ul className="space-y-3" role="list">
                  {otherScores.map((item, index) => (
                    <li key={index} className={form.card}>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        <label className={form.field + " min-w-0 flex-1"}>
                          <span className={form.label}>Test or subject</span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              setOtherScores((prev) =>
                                prev.map((v, i) =>
                                  i === index ? { ...v, name: e.target.value } : v
                                )
                              )
                            }
                            placeholder="e.g. AP Calculus BC, SAT Physics"
                            className={form.input}
                          />
                        </label>
                        <label className={form.field + " w-full sm:w-28 shrink-0"}>
                          <span className={form.label}>Score</span>
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              setOtherScores((prev) =>
                                prev.map((v, i) =>
                                  i === index ? { ...v, value: e.target.value } : v
                                )
                              )
                            }
                            placeholder="e.g. 5, 800"
                            className={form.input}
                          />
                        </label>
                        <div className="flex items-end pb-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setOtherScores((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className={form.btnDanger}
                            aria-label={`Remove score ${index + 1}`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
        </div>

        <div
          id="activities"
          className={activeSection === "activities" ? "animate-fade-in-up motion-reduce:animate-none" : "hidden"}
        >
      <section className={form.section} aria-labelledby="activities-heading" aria-describedby="activities-desc">
        <header className={form.sectionHeader}>
          <h2 id="activities-heading" className={form.sectionTitle}>Stand out</h2>
          <p id="activities-desc" className={form.sectionDesc}>Showcase what makes you unique—clubs, leadership, and achievements that tell your story.</p>
        </header>

        <div className={form.fieldGroup}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={form.subsectionTitle}>Activities</h3>
            <button
              type="button"
              onClick={() => {
                if (activities.length >= MAX_ACTIVITIES) return;
                const nextIndex = activities.length;
                setActivities((prev) => [...prev, { heading: "", description: "" }]);
                setEditingActivityIndex(nextIndex);
              }}
              disabled={activities.length >= MAX_ACTIVITIES}
              className={form.btnSecondary + " shrink-0"}
              aria-label="Add activity"
            >
              <PlusIcon className="h-4 w-4 shrink-0" />
              Add activity
            </button>
          </div>
          {activities.length === 0 ? (
            <p className={form.emptyState}>Nothing here yet. Add your first activity to highlight leadership and involvement.</p>
          ) : (
          <ol className="space-y-2" role="list" style={{ listStyle: "none" }}>
            {activities.map((item, index) => (
              <li key={index} className={form.card}>
                {editingActivityIndex === index ? (
                  <div className="space-y-4">
                    <span className="text-caption font-semibold text-slate-500">#{index + 1}</span>
                    <label className={form.field}>
                      <span className={form.label}>Title & role</span>
                      <input
                        type="text"
                        value={item.heading}
                        onChange={(e) =>
                          setActivities((prev) =>
                            prev.map((v, i) => (i === index ? { ...v, heading: e.target.value } : v))
                          )
                        }
                        placeholder="e.g. Debate Club – President"
                        maxLength={200}
                        className={form.input}
                      />
                      <span className={form.helper}>{item.heading.length}/200</span>
                    </label>
                    <label className={form.field}>
                      <span className={form.label}>What you did</span>
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          setActivities((prev) =>
                            prev.map((v, i) => (i === index ? { ...v, description: e.target.value } : v))
                          )
                        }
                        rows={2}
                        placeholder="e.g. Led weekly meetings, organized regional tournament—what impact did you have?"
                        maxLength={299}
                        className={form.textarea}
                      />
                      <span className={form.helper}>{item.description.length}/299</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingActivityIndex(null)}
                        className={form.btnPrimary}
                      >
                        <SaveIcon className="h-4 w-4 shrink-0" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingActivityIndex(null)}
                        className={form.btnSecondary}
                      >
                        Cancel
                      </button>
                      {activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivities((prev) => prev.filter((_, i) => i !== index));
                            setEditingActivityIndex(null);
                          }}
                          className={form.btnDangerText}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="shrink-0 text-body-sm font-semibold text-slate-500">{index + 1}.</span>
                      <span className="min-w-0 text-body-sm text-slate-800">
                        {item.heading.trim() || "Untitled activity"}
                        {item.description.trim() ? (
                          <span className="mt-0.5 block text-caption text-slate-500">{item.description.trim()}</span>
                        ) : null}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingActivityIndex(index)}
                      className={form.btnSecondary + " shrink-0"}
                      aria-label={`Edit activity ${index + 1}`}
                    >
                      <PencilIcon className="h-4 w-4 shrink-0" />
                      Edit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          )}
        </div>

        <div className={form.fieldGroup}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={form.subsectionTitle}>Honors & awards</h3>
            <button
              type="button"
              onClick={() => {
                if (honors.length >= MAX_HONORS) return;
                const nextIndex = honors.length;
                setHonors((prev) => [...prev, { heading: "", description: "" }]);
                setEditingHonorIndex(nextIndex);
              }}
              disabled={honors.length >= MAX_HONORS}
              className={form.btnSecondary + " shrink-0"}
              aria-label="Add honor"
            >
              <PlusIcon className="h-4 w-4 shrink-0" />
              Add honor
            </button>
          </div>
          {honors.length === 0 ? (
            <p className={form.emptyState}>No honors yet. Add awards, recognitions, or distinctions to round out your profile.</p>
          ) : (
          <ol className="space-y-2" role="list" style={{ listStyle: "none" }}>
            {honors.map((item, index) => (
              <li key={index} className={form.card}>
                {editingHonorIndex === index ? (
                  <div className="space-y-4">
                    <span className="text-caption font-semibold text-slate-500">#{index + 1}</span>
                    <label className={form.field}>
                      <span className={form.label}>Award or honor name</span>
                      <input
                        type="text"
                        value={item.heading}
                        onChange={(e) =>
                          setHonors((prev) =>
                            prev.map((v, i) => (i === index ? { ...v, heading: e.target.value } : v))
                          )
                        }
                        placeholder="e.g. National Merit Semifinalist, Science Olympiad State Champion"
                        maxLength={200}
                        className={form.input}
                      />
                      <span className={form.helper}>{item.heading.length}/200</span>
                    </label>
                    <label className={form.field}>
                      <span className={form.label}>Details (optional)</span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          setHonors((prev) =>
                            prev.map((v, i) => (i === index ? { ...v, description: e.target.value } : v))
                          )
                        }
                        placeholder="Level, year, or a bit of context"
                        maxLength={299}
                        className={form.input}
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingHonorIndex(null)}
                        className={form.btnPrimary}
                      >
                        <SaveIcon className="h-4 w-4 shrink-0" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHonorIndex(null)}
                        className={form.btnSecondary}
                      >
                        Cancel
                      </button>
                      {honors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setHonors((prev) => prev.filter((_, i) => i !== index));
                            setEditingHonorIndex(null);
                          }}
                          className={form.btnDangerText}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="shrink-0 text-body-sm font-semibold text-slate-500">{index + 1}.</span>
                      <span className="min-w-0 text-body-sm text-slate-800">
                        {item.heading.trim() || "Untitled honor"}
                        {item.description.trim() ? (
                          <span className="mt-0.5 block text-caption text-slate-500">{item.description.trim()}</span>
                        ) : null}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingHonorIndex(index)}
                      className={form.btnSecondary + " shrink-0"}
                      aria-label={`Edit honor ${index + 1}`}
                    >
                      <PencilIcon className="h-4 w-4 shrink-0" />
                      Edit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          )}
        </div>
      </section>
        </div>

        <div
          id="essay"
          className={activeSection === "essay" ? "animate-fade-in-up motion-reduce:animate-none" : "hidden"}
        >
      <section className={form.section} aria-labelledby="essay-heading" aria-describedby="essay-desc">
        <header className={form.sectionHeader}>
          <h2 id="essay-heading" className={form.sectionTitle}>Tell your story</h2>
          <p id="essay-desc" className={form.sectionDesc}>Personal essay, LOR expectations, and resume.</p>
        </header>

        <label className={form.field}>
          <span className={form.label}>Personal essay</span>
          <textarea
            id="profile-personal-essay"
            value={personalEssay}
            onChange={(e) => setPersonalEssay(e.target.value)}
            rows={10}
            placeholder="Paste or write your personal statement here…"
            className={form.textarea}
          />
          <span className={form.helper}>Use the analyzer below to get feedback on coherence and narrative strength.</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={analyzePersonalEssay}
            disabled={analyzing || !personalEssay.trim()}
            className={form.btnSecondary}
          >
            {analyzing ? (
              <>
                <LoaderIcon className="h-4 w-4 shrink-0 animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              "Analyze essay"
            )}
          </button>
          {analysisError && (
            <span className={form.error} role="alert">
              {analysisError}
            </span>
          )}
        </div>

        {essayAnalysis && (
          <div className={form.card} role="status">
            <h3 className={form.subsectionTitle}>Essay analysis</h3>
            <p className="mt-2 text-body-sm text-slate-600">
              Overall score: <strong className="text-slate-900">{essayAnalysis.essayScore0_100}/100</strong>
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-body-sm text-slate-600">
              <li>Coherence: <strong>{essayAnalysis.coherence}/10</strong></li>
              <li>Narrative depth: <strong>{essayAnalysis.narrativeDepth}/10</strong></li>
              <li>Originality: <strong>{essayAnalysis.originality}/10</strong></li>
              <li>Alignment: <strong>{essayAnalysis.alignment}/10</strong></li>
            </ul>
          </div>
        )}

        <label className={form.field}>
          <span className={form.label}>Overall LOR strength (1–10)</span>
          <input
            id="profile-lor-rating"
            type="number"
            min="1"
            max="10"
            value={lorRating}
            onChange={(e) => setLorRating(e.target.value)}
            placeholder="1–10"
            className={`${form.input} max-w-[8rem]`}
          />
          <span className={form.helper}>Your estimate of how strong your letters will be overall.</span>
        </label>

        <div className={form.field}>
          <span className={form.label}>Resume</span>
          <p className={form.helper}>Upload a PDF or paste a link (e.g. Google Drive, Dropbox).</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label htmlFor="resume-upload" className="cursor-pointer">
              <span className={`${form.btnSecondary} inline-flex cursor-pointer`}>
                {resumeUploading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 shrink-0 animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  "Choose file"
                )}
              </span>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                disabled={resumeUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadResume(f);
                  e.target.value = "";
                }}
              />
            </label>
            {resumeUploadError && (
              <span className={form.error} role="alert">
                {resumeUploadError}
              </span>
            )}
          </div>
          <input
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="Or paste resume URL"
            className={`${form.input} mt-2`}
            aria-label="Resume URL"
          />
        </div>
      </section>
        </div>

        <div
          id="lors"
          className={activeSection === "lors" ? "animate-fade-in-up motion-reduce:animate-none" : "hidden"}
        >
      <section className={form.section} aria-labelledby="lors-heading" aria-describedby="lors-desc">
        <header className={form.sectionHeader}>
          <h2 id="lors-heading" className={form.sectionTitle}>Who vouches for you</h2>
          <p id="lors-desc" className={form.sectionDesc}>Manage recommenders and their strength, relationship, and credibility ratings (1–10).</p>
        </header>
        <Link
          href="/linku-ai/profile/lors"
          className={form.btnSecondary}
        >
          Manage LORs
        </Link>
        {lors.length > 0 ? (
          <ul className="space-y-3" role="list">
            {lors.map((lor) => (
              <li key={lor.id} className={form.card}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{lor.teacherName}</span>
                  <span className="flex flex-wrap gap-2 text-caption text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">Strength {lor.strengthRating}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">Relationship {lor.relationshipRating}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">Credibility {lor.credibilityRating}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={form.emptyState}>No LORs added yet. Use “Manage LORs” to add recommenders and ratings.</p>
        )}
      </section>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-end gap-3 rounded-input border-t border-slate-200/70 bg-slate-50/80 px-3 py-4 sm:mt-8 sm:pt-6">
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className={form.btnPrimary + " min-h-[48px] px-6 py-3 text-body shadow-sm"}
          >
            {saving ? (
              <>
                <LoaderIcon className="h-5 w-5 shrink-0 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5 shrink-0" />
                <span>Save profile</span>
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
