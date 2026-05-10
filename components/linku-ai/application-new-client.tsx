"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { UniversitySearchSelect } from "./university-search-select";
import type { SupplementEssayItem } from "@/lib/linku-ai/schemas";

const form = {
  alertError:
    "rounded-input border border-red-200/80 bg-red-50/95 px-4 py-3.5 text-body-sm text-red-800 flex items-center gap-3 min-h-[48px] animate-fade-in-up motion-reduce:animate-none",
  label: "text-body-sm font-medium text-slate-700",
  caption: "text-caption text-slate-500",
  input:
    "block w-full min-h-[44px] rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body-sm text-slate-900 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-200 ease-out disabled:bg-slate-50 disabled:text-slate-500",
  textarea:
    "block w-full rounded-input border border-slate-200 bg-white px-3.5 py-2.5 text-body-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 transition-colors duration-200 ease-out resize-y min-h-[100px]",
  sectionTitle: "text-title-sm font-semibold text-slate-900",
  sectionSubtitle: "mt-1 text-body-sm text-slate-600",
  fieldDivider: "border-b border-slate-100 pb-4 last:border-0 last:pb-0",
} as const;

export function ApplicationNewClient() {
  const router = useRouter();
  const [universityId, setUniversityId] = useState("");
  const [round, setRound] = useState("RD");
  const [financialAidRequest, setFinancialAidRequest] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [supplement, setSupplement] = useState<SupplementEssayItem>({
    heading: "",
    wordLimit: null,
    answer: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addApplication() {
    if (!universityId) return;
    setSaving(true);
    setError(null);
    try {
      const supplementEssaysJson =
        supplement.heading.trim() || supplement.answer.trim()
          ? [supplement]
          : undefined;
      const res = await fetch("/api/linku-ai/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId,
          round,
          financialAidRequest,
          status,
          supplementEssaysJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      router.push(`/linku-ai/applications/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
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

      <section className="card-app-section" aria-labelledby="add-details-heading">
        <h2 id="add-details-heading" className={form.sectionTitle}>
          University &amp; round
        </h2>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className={form.label}>University</span>
            <UniversitySearchSelect
              value={universityId}
              onChange={(id) => setUniversityId(id)}
              placeholder="Type to search universities…"
            />
          </label>
          <label className="block space-y-2">
            <span className={form.label}>Round</span>
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className={form.input}
              aria-describedby="round-helper"
            >
              <option value="ED">ED</option>
              <option value="ED2">ED2</option>
              <option value="EA">EA</option>
              <option value="REA">REA</option>
              <option value="RD">RD</option>
              <option value="ROLLING">Rolling</option>
            </select>
            <span id="round-helper" className={form.caption}>
              Early Decision, Early Action, Regular Decision, etc.
            </span>
          </label>
          <label className="block space-y-2">
            <span className={form.label}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "SUBMITTED")}
              className={form.input}
            >
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={financialAidRequest}
              onChange={(e) => setFinancialAidRequest(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20"
              aria-describedby="financial-helper"
            />
            <span className={form.label}>Financial aid requested</span>
          </label>
          <p id="financial-helper" className={form.caption}>
            Check if you’re applying for need-based aid at this school.
          </p>
        </div>
      </section>

      <section className="card-app-section" aria-labelledby="add-supplement-heading">
        <h2 id="add-supplement-heading" className={form.sectionTitle}>
          First supplement (optional)
        </h2>
        <p className={form.sectionSubtitle}>
          You can add more supplements after saving. Start here if you like.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className={form.caption}>Heading / prompt</span>
            <input
              type="text"
              value={supplement.heading}
              onChange={(e) => setSupplement((s) => ({ ...s, heading: e.target.value }))}
              placeholder="e.g. Why this university?"
              maxLength={500}
              className={form.input}
            />
          </label>
          <label className="block space-y-2">
            <span className={form.caption}>Word limit</span>
            <input
              type="number"
              min={0}
              max={5000}
              value={supplement.wordLimit ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setSupplement((s) => ({
                  ...s,
                  wordLimit: v === "" ? null : Math.max(0, parseInt(v, 10) || 0),
                }));
              }}
              placeholder="Optional"
              className={form.input + " w-28"}
            />
          </label>
          <label className="block space-y-2">
            <span className={form.caption}>Your answer</span>
            <textarea
              value={supplement.answer}
              onChange={(e) => setSupplement((s) => ({ ...s, answer: e.target.value }))}
              rows={6}
              placeholder="Write or paste your response here."
              className={form.textarea}
            />
            {supplement.wordLimit != null && supplement.wordLimit > 0 && (
              <span className={form.caption}>
                {supplement.answer.trim().split(/\s+/).filter(Boolean).length} / {supplement.wordLimit} words
              </span>
            )}
          </label>
        </div>
      </section>

      <div className="form-divider pt-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addApplication}
            disabled={saving || !universityId}
            className="btn-app-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Adding…
              </>
            ) : (
              "Add application"
            )}
          </button>
          <Link href="/linku-ai/applications" className="btn-app-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
