"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SupplementEssayItem } from "@/lib/linku-ai/schemas";

type Application = {
  id: string;
  round: string;
  financialAidRequest: boolean | null;
  supplementEssay: string | null;
  supplementEssaysJson: unknown;
  status: string;
  university: {
    id: string;
    name: string;
    slug: string;
    supplementPromptsJson?: unknown;
  };
};

type UniversityStats = {
  gpa25: number | null;
  gpa50: number | null;
  gpa75: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  acceptanceRate: number | null;
} | null;

type EssayAnalysisResult = {
  essayScore0_100: number;
  valueAlignmentScore0_100?: number | null;
  coherence: number;
  narrativeDepth: number;
  originality: number;
  alignment: number;
};

function parseSupplementEssays(application: Application): SupplementEssayItem[] {
  const raw = application.supplementEssaysJson;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item: unknown) => {
      if (item && typeof item === "object" && "heading" in item && "answer" in item) {
        const o = item as Record<string, unknown>;
        return {
          heading: typeof o.heading === "string" ? o.heading : "",
          wordLimit:
            typeof o.wordLimit === "number" && Number.isInteger(o.wordLimit) ? o.wordLimit : null,
          answer: typeof o.answer === "string" ? o.answer : "",
        };
      }
      return { heading: "", wordLimit: null, answer: "" };
    });
  }
  if (application.supplementEssay?.trim()) {
    return [{ heading: "Supplement", wordLimit: null, answer: application.supplementEssay }];
  }
  return [{ heading: "", wordLimit: null, answer: "" }];
}

const DEFAULT_ITEM: SupplementEssayItem = { heading: "", wordLimit: null, answer: "" };

const form = {
  label: "text-body-sm font-medium text-slate-700",
  caption: "text-caption text-slate-500",
  input:
    "block w-full min-h-[44px] rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body-sm text-slate-900 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-200 ease-out disabled:bg-slate-50 disabled:text-slate-500",
  textarea:
    "block w-full rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-200 ease-out resize-y min-h-[120px]",
  sectionTitle: "text-title-sm font-semibold text-slate-900",
  sectionSubtitle: "mt-1 text-body-sm text-slate-600",
  alertError:
    "rounded-input border border-red-200/80 bg-red-50/95 px-4 py-3.5 text-body-sm text-red-800 flex items-center gap-3 min-h-[48px] animate-fade-in-up motion-reduce:animate-none",
  alertSuccess:
    "rounded-input border border-emerald-200/80 bg-emerald-50/95 px-4 py-3.5 text-body-sm text-emerald-800 flex items-center gap-3 min-h-[48px] animate-fade-in-up motion-reduce:animate-none",
  supplementBlock: "rounded-input border border-slate-200/80 bg-slate-50/50 p-4 space-y-3",
  analysisBlock: "mt-4 rounded-input border border-slate-200 bg-slate-50/80 p-4",
} as const;

export function LinkUAiApplicationEditClient({
  application,
  universityStats,
}: {
  application: Application;
  universityStats?: UniversityStats;
}) {
  const initialEssays = useMemo(() => parseSupplementEssays(application), [application]);
  const [round, setRound] = useState(application.round);
  const [financialAidRequest, setFinancialAidRequest] = useState(
    application.financialAidRequest ?? false
  );
  const [supplements, setSupplements] = useState<SupplementEssayItem[]>(initialEssays);
  const [status, setStatus] = useState(application.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<EssayAnalysisResult | null>(null);
  const [outcomeResult, setOutcomeResult] = useState("");
  const [outcomeSaving, setOutcomeSaving] = useState(false);
  const [outcomeSuccess, setOutcomeSuccess] = useState(false);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);

  const combinedEssayText = supplements
    .map((s) => s.answer.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");

  function updateSupplement(index: number, patch: Partial<SupplementEssayItem>) {
    setSupplements((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addSupplement() {
    setSupplements((prev) => [...prev, { ...DEFAULT_ITEM }]);
  }

  function removeSupplement(index: number) {
    setSupplements((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/linku-ai/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          financialAidRequest,
          supplementEssaysJson: supplements,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function analyzeEssay() {
    const text = combinedEssayText;
    if (!text) {
      setAnalysisError("Add some essay text in at least one supplement first.");
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/linku-ai/essay/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayType: "SUPPLEMENT",
          content: text,
          universityId: application.university.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis({
        essayScore0_100: data.essayScore0_100,
        valueAlignmentScore0_100: data.valueAlignmentScore0_100,
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

  async function recordOutcome() {
    if (!outcomeResult) return;
    setOutcomeSaving(true);
    setOutcomeError(null);
    setOutcomeSuccess(false);
    try {
      const res = await fetch("/api/linku-ai/outcomes/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: application.university.id,
          result: outcomeResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record");
      setOutcomeSuccess(true);
    } catch (e) {
      setOutcomeError(e instanceof Error ? e.message : "Failed to record");
    } finally {
      setOutcomeSaving(false);
    }
  }

  return (
    <div className="page-content space-y-8">
      {error && (
        <div className={form.alertError} role="alert" aria-live="assertive">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700 text-caption font-bold"
            aria-hidden
          >
            !
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className={form.alertSuccess} role="status" aria-live="polite">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 font-bold"
            aria-hidden
          >
            ✓
          </span>
          <span>Saved.</span>
        </div>
      )}

      {universityStats &&
          (universityStats.gpa25 != null ||
            universityStats.sat25 != null ||
            universityStats.acceptanceRate != null) && (
            <section className="card-app-muted" aria-labelledby="stats-heading">
              <h3 id="stats-heading" className={form.sectionTitle}>
                Admission statistics (typical class)
              </h3>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-slate-600" role="list">
                {universityStats.gpa25 != null && (
                  <li>
                    GPA 25/50/75: {universityStats.gpa25} / {universityStats.gpa50} /{" "}
                    {universityStats.gpa75}
                  </li>
                )}
                {universityStats.sat25 != null && (
                  <li>
                    SAT 25/50/75: {universityStats.sat25} / {universityStats.sat50} /{" "}
                    {universityStats.sat75}
                  </li>
                )}
                {universityStats.acceptanceRate != null && (
                  <li>Acceptance rate: {universityStats.acceptanceRate}%</li>
                )}
              </ul>
            </section>
          )}

      <section className="card-app-section" aria-labelledby="details-heading">
        <h2 id="details-heading" className={form.sectionTitle}>
          Round &amp; status
        </h2>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className={form.label}>Round</span>
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className={form.input}
              aria-describedby="round-desc"
            >
              <option value="ED">ED</option>
              <option value="ED2">ED2</option>
              <option value="EA">EA</option>
              <option value="REA">REA</option>
              <option value="RD">RD</option>
              <option value="ROLLING">Rolling</option>
            </select>
            <span id="round-desc" className={form.caption}>Early Decision, Early Action, Regular Decision, etc.</span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={financialAidRequest}
              onChange={(e) => setFinancialAidRequest(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20"
            />
            <span className={form.label}>Financial aid requested</span>
          </label>
          <label className="block space-y-2">
            <span className={form.label}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={form.input}
            >
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card-app-section" aria-labelledby="supplements-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="supplements-heading" className={form.sectionTitle}>
            Supplement essays
          </h2>
          <button
            type="button"
            onClick={addSupplement}
            className="btn-app-secondary"
            aria-label="Add another supplement"
          >
            Add another
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {supplements.map((item, index) => (
            <div
              key={index}
              className={form.supplementBlock}
            >
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 min-w-0 space-y-2">
                  <span className={form.caption}>Heading / prompt</span>
                  <input
                    type="text"
                    value={item.heading}
                    onChange={(e) => updateSupplement(index, { heading: e.target.value })}
                    placeholder="e.g. Why this university?"
                    maxLength={500}
                    className={form.input}
                  />
                </label>
                <label className="w-28 shrink-0 space-y-2">
                  <span className={form.caption}>Word limit</span>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={item.wordLimit ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      updateSupplement(index, {
                        wordLimit: v === "" ? null : Math.max(0, parseInt(v, 10) || 0),
                      });
                    }}
                    placeholder="Optional"
                    className={form.input}
                  />
                </label>
                {supplements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupplement(index)}
                    className="btn-app-ghost-danger"
                    aria-label={`Remove supplement ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="block space-y-2">
                <span className={form.caption}>Your answer</span>
                <textarea
                  value={item.answer}
                  onChange={(e) => updateSupplement(index, { answer: e.target.value })}
                  rows={8}
                  placeholder="Write or paste your response here."
                  className={form.textarea}
                />
                {item.wordLimit != null && item.wordLimit > 0 && (
                  <span className={form.caption}>
                    {item.answer.trim().split(/\s+/).filter(Boolean).length} / {item.wordLimit} words
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={analyzeEssay}
            disabled={analyzing || !combinedEssayText.trim()}
            className="btn-app-secondary"
          >
            {analyzing ? "Analyzing…" : "Analyze essay"}
          </button>
          {analysisError && (
            <span className="text-body-sm text-red-600" role="alert">
              {analysisError}
            </span>
          )}
        </div>
        {analysis && (
          <div className={form.analysisBlock} role="status">
            <h3 className={form.sectionTitle}>Essay analysis</h3>
            <p className="mt-2 text-body-sm text-slate-600">
              Overall score: <strong className="text-slate-900">{analysis.essayScore0_100}/100</strong>
              {analysis.valueAlignmentScore0_100 != null && (
                <>
                  {" "}
                  · Value alignment: <strong className="text-slate-900">{analysis.valueAlignmentScore0_100}/100</strong>
                </>
              )}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-slate-600" role="list">
              <li>Coherence: {analysis.coherence}/10</li>
              <li>Narrative depth: {analysis.narrativeDepth}/10</li>
              <li>Originality: {analysis.originality}/10</li>
              <li>Alignment: {analysis.alignment}/10</li>
            </ul>
          </div>
        )}
      </section>

      <div className="form-divider pt-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-app-primary"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link href="/linku-ai/applications" className="btn-app-secondary">
            Back to applications
          </Link>
          <Link href="/mentors" className="btn-app-secondary">
            Get feedback from a mentor
          </Link>
        </div>
      </div>

      <section className="card-app-section" aria-labelledby="outcome-heading">
        <h2 id="outcome-heading" className={form.sectionTitle}>
          Record your result
        </h2>
        <p className={form.sectionSubtitle}>
          After you hear back, record your outcome to help improve our fit estimates (stored
          anonymously for ML).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={outcomeResult}
            onChange={(e) => setOutcomeResult(e.target.value)}
            className={form.input + " max-w-[12rem]"}
            aria-label="Application result"
          >
            <option value="">Select result</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WAITLIST">Waitlist</option>
          </select>
          <button
            type="button"
            onClick={recordOutcome}
            disabled={outcomeSaving || !outcomeResult}
            className="btn-app-secondary"
          >
            {outcomeSaving ? "Saving…" : "Record result"}
          </button>
          {outcomeError && (
            <span className="text-body-sm text-red-600" role="alert">
              {outcomeError}
            </span>
          )}
          {outcomeSuccess && (
            <span className="text-body-sm text-emerald-700" role="status">
              Result recorded.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
