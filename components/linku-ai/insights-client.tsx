"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Application = {
  universityId: string;
  university: { id: string; name: string; slug: string };
};

type SupplementBreakdown = {
  valueAlignment: number;
  specificity: number;
  narrativeDepth: number;
  authenticity: number;
  clarity: number;
};

type UniversityInsights = {
  band: string | null;
  composite_score: number | null;
  supplement_breakdown: SupplementBreakdown | null;
  has_supplement: boolean;
  available_majors: string[];
};

type SimulateResult = {
  new_band: string;
  new_score: number;
  impact_message: string;
};

const RADAR_KEYS: { key: keyof SupplementBreakdown; label: string }[] = [
  { key: "valueAlignment", label: "Value Alignment" },
  { key: "specificity", label: "Specificity" },
  { key: "narrativeDepth", label: "Narrative Depth" },
  { key: "authenticity", label: "Authenticity" },
  { key: "clarity", label: "Clarity" },
];

function breakdownToRadarData(breakdown: SupplementBreakdown): { subject: string; value: number; fullMark: number }[] {
  return RADAR_KEYS.map(({ key, label }) => ({
    subject: label,
    value: breakdown[key],
    fullMark: 10,
  }));
}

function formatBand(band: string): string {
  return band.replace(/_/g, " ");
}

export function LinkUAiInsightsClient({ applications }: { applications: Application[] }) {
  const [universityId, setUniversityId] = useState("");
  const [insights, setInsights] = useState<UniversityInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedMajor, setSimulatedMajor] = useState("");
  const [simulateResult, setSimulateResult] = useState<SimulateResult | null>(null);
  const [simulateLoading, setSimulateLoading] = useState(false);

  const fetchInsights = useCallback(async (id: string) => {
    if (!id) {
      setInsights(null);
      setSimulateResult(null);
      setSimulatedMajor("");
      return;
    }
    setLoading(true);
    setError(null);
    setInsights(null);
    setSimulateResult(null);
    setSimulatedMajor("");
    try {
      const res = await fetch(`/api/linku-ai/insights/university?university_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load insights");
      setInsights(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (universityId) fetchInsights(universityId);
    else {
      setInsights(null);
      setSimulateResult(null);
      setSimulatedMajor("");
    }
  }, [universityId, fetchInsights]);

  async function runSimulate() {
    if (!universityId || !simulatedMajor) return;
    setSimulateLoading(true);
    setSimulateResult(null);
    try {
      const res = await fetch("/api/linku-ai/insights/simulate-major", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university_id: universityId, simulated_major: simulatedMajor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Simulation failed");
      setSimulateResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
      setSimulateResult(null);
    } finally {
      setSimulateLoading(false);
    }
  }

  const radarData = insights?.supplement_breakdown
    ? breakdownToRadarData(insights.supplement_breakdown)
    : [];

  return (
    <div className="page-content space-y-8">
      {/* Section 1: University selector */}
      <div className="card-app p-6">
        <h2 className="text-title-sm font-semibold text-slate-900 mb-2">University</h2>
        <p className="text-caption text-slate-500 mb-4">
          Select one of your applications to view supplement strength and fit insights.
        </p>
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          className="block w-full max-w-md rounded-input border border-slate-200 px-3 py-2 text-body-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Select university"
        >
          <option value="">Select university</option>
          {applications.map((a) => (
            <option key={a.universityId} value={a.universityId}>
              {a.university.name}
            </option>
          ))}
        </select>
        {applications.length === 0 && (
          <p className="mt-2 text-body-sm text-amber-700">
            Add universities in Applications first to see insights here.
          </p>
        )}
      </div>

      {error && (
        <div
          className="card-app-section border-red-200 bg-red-50/80 px-4 py-3 text-body-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="card-app p-6 text-body-sm text-slate-500">Loading insights…</div>
      )}

      {!loading && insights && universityId && (
        <>
          {/* Section 2: Supplement Strength Heatmap */}
          <div className="card-app p-6">
            <h2 className="text-title-sm font-semibold text-slate-900 mb-2">
              Supplement Strength Heatmap
            </h2>
            {insights.has_supplement && insights.supplement_breakdown ? (
              <div className="mt-4 h-[320px] w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#475569", fontSize: 11 }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Radar
                      name="Supplement"
                      dataKey="value"
                      stroke="var(--color-brand-600, #2563eb)"
                      fill="var(--color-brand-500, #3b82f6)"
                      fillOpacity={0.4}
                      strokeWidth={1.5}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(value: number | undefined) => [value ?? 0, "Score"]}
                      labelFormatter={(label) => label}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-2 text-body-sm text-slate-600">
                No supplement found for this university.
              </p>
            )}
          </div>

          {/* Section 3: Current Fit Band */}
          <div className="card-app p-6">
            <h2 className="text-title-sm font-semibold text-slate-900 mb-2">Current fit band</h2>
            {insights.band != null ? (
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium bg-brand-100 text-brand-800"
                  data-band={insights.band}
                >
                  {formatBand(insights.band)}
                </span>
                {insights.composite_score != null && (
                  <span className="text-caption text-slate-500">
                    Composite score: {Math.round(insights.composite_score)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-body-sm text-slate-600">No active statistics for this university.</p>
            )}
          </div>

          {/* Section 4: Major Switch Simulator */}
          <div className="card-app p-6">
            <h2 className="text-title-sm font-semibold text-slate-900 mb-2">
              Simulate different major
            </h2>
            <p className="text-caption text-slate-500 mb-4">
              See how your fit band would change if you applied under a different intended major.
              This does not change your profile or save anything.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="sr-only">Simulate major</span>
                <select
                  value={simulatedMajor}
                  onChange={(e) => {
                    setSimulatedMajor(e.target.value);
                    setSimulateResult(null);
                  }}
                  className="block w-full min-w-[200px] rounded-input border border-slate-200 px-3 py-2 text-body-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  aria-label="Simulate different major"
                >
                  <option value="">Choose major</option>
                  {insights.available_majors.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={runSimulate}
                disabled={simulateLoading || !simulatedMajor}
                className="focus-ring min-h-[44px] rounded-input border border-brand-600 bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {simulateLoading ? "Calculating…" : "Simulate"}
              </button>
            </div>
            {simulateResult && (
              <div className="mt-4 rounded-card border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <span className="text-body-sm font-medium text-slate-700">Simulated band:</span>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium bg-slate-200 text-slate-800"
                    data-band={simulateResult.new_band}
                  >
                    {formatBand(simulateResult.new_band)}
                  </span>
                  <span className="text-caption text-slate-500">
                    Score: {Math.round(simulateResult.new_score)}
                  </span>
                </div>
                <p className="text-body-sm text-slate-600">{simulateResult.impact_message}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
