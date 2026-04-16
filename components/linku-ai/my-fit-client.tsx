"use client";

import { useState } from "react";

type University = { id: string; name: string; slug: string };

type ScoreResult = {
  academicScore: number;
  ecaScore: number;
  majorScore: number;
  essayScore: number;
  contextScore: number;
  composite0To100: number;
  band: string;
};

type UniversityStats = {
  gpa25: number | null;
  gpa50: number | null;
  gpa75: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  acceptanceRate: number | null;
};

type MyFitResult = {
  university: { id: string; name: string; slug: string };
  score: ScoreResult | null;
  stats: UniversityStats | null;
};

const CATEGORIES: { key: keyof ScoreResult; label: string }[] = [
  { key: "academicScore", label: "Academic" },
  { key: "ecaScore", label: "ECA" },
  { key: "majorScore", label: "Major" },
  { key: "essayScore", label: "Essay" },
  { key: "contextScore", label: "Context" },
  { key: "composite0To100", label: "Composite" },
];

export function LinkUAiMyFitClient({ universities }: { universities: University[] }) {
  const [universityId, setUniversityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MyFitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMyFit() {
    if (!universityId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/linku-ai/my-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "My fit failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "My fit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content space-y-6">
      <div className="card-app p-6 space-y-4">
        <label className="block">
          <span className="text-caption text-slate-500">University</span>
          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            className="mt-1 block w-full rounded-input border border-slate-200 px-3 py-2 text-body-sm"
          >
            <option value="">Select university</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={runMyFit}
          disabled={loading || !universityId}
          className="focus-ring min-h-[44px] rounded-input border border-brand-600 bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Calculating…" : "See my fit"}
        </button>
      </div>

      {error && (
        <div className="card-app-section border-red-200 bg-red-50/80 px-4 py-3 text-body-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="card-app p-6">
            <h2 className="text-title-sm font-semibold text-slate-900">Your fit at {result.university.name}</h2>
            {result.stats && (
              <div className="mb-4 rounded-input border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-caption font-medium text-slate-700">Admission statistics (typical class)</h3>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-slate-600">
                  {result.stats.gpa25 != null && (
                    <li>GPA 25/50/75: {result.stats.gpa25} / {result.stats.gpa50} / {result.stats.gpa75}</li>
                  )}
                  {result.stats.sat25 != null && (
                    <li>SAT 25/50/75: {result.stats.sat25} / {result.stats.sat50} / {result.stats.sat75}</li>
                  )}
                  {result.stats.acceptanceRate != null && (
                    <li>Acceptance rate: {result.stats.acceptanceRate}%</li>
                  )}
                </ul>
              </div>
            )}
            {result.score ? (
              <>
                <p className="mt-2 text-body-sm text-slate-600">
                  <strong>{result.score.band.replace(/_/g, " ")}</strong> — Composite score:{" "}
                  <strong>{Math.round(result.score.composite0To100)}/100</strong>
                </p>
                <ul className="mt-4 space-y-1 text-body-sm text-slate-600">
                  {result.score &&
                    CATEGORIES.map(({ key, label }) => (
                      <li key={key}>
                        {label}: {Math.round(Number(result.score![key]) || 0)}/100
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-body-sm text-slate-500">
                No admission statistics are available for this university yet. Complete your profile and add a
                supplement essay for this school to improve your score when data is added.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
