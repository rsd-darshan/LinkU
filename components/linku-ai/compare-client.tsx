"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type User = { id: string; email: string; fullName: string };
type University = { id: string; name: string; slug: string };

type CompareResult = {
  comparison: {
    academicFitComparison: string;
    ecaComparison: string;
    majorAlignmentComparison: string;
    essayComparison: string;
    supplementValueComparison: string;
    lorComparison: string;
    finalAdvantage: "A" | "B" | "TIE";
    explanation: string;
  };
  userAScore?: {
    academicScore: number;
    ecaScore: number;
    majorScore: number;
    essayScore: number;
    contextScore: number;
    composite0To100: number;
    band: string;
  } | null;
  userBScore?: {
    academicScore: number;
    ecaScore: number;
    majorScore: number;
    essayScore: number;
    contextScore: number;
    composite0To100: number;
    band: string;
  } | null;
};

const CATEGORIES = [
  { key: "academicScore", label: "Academic" },
  { key: "ecaScore", label: "ECA" },
  { key: "majorScore", label: "Major" },
  { key: "essayScore", label: "Essay" },
  { key: "contextScore", label: "Context" },
  { key: "composite0To100", label: "Composite" },
];

export function LinkUAiCompareClient({
  currentUserId,
  users,
  peerUsers,
  universities,
}: {
  currentUserId: string;
  users: User[];
  peerUsers?: User[];
  universities: University[];
}) {
  const peerList = peerUsers && peerUsers.length > 0 ? peerUsers : users;
  const userAId = currentUserId;
  const [userBId, setUserBId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCompare() {
    if (!userAId || !userBId || !universityId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/linku-ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAId, userBId, universityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comparison failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  const chartData =
    result?.userAScore && result?.userBScore
      ? CATEGORIES.map(({ key, label }) => ({
          name: label,
          userA: Math.round(Number((result.userAScore as Record<string, unknown>)[key]) || 0),
          userB: Math.round(Number((result.userBScore as Record<string, unknown>)[key]) || 0),
        }))
      : [];

  return (
    <div className="page-content space-y-6">
      <div className="card-app p-6 space-y-4">
        <div className="block">
          <span className="text-caption text-slate-500">You (User A)</span>
          <p className="mt-1 text-body-sm text-slate-700">Your profile will be used as User A.</p>
        </div>
        <label className="block">
          <span className="text-caption text-slate-500">
            {peerUsers && peerUsers.length > 0 ? "Peer (User B) — from your connections" : "User B"}
          </span>
          <select
            value={userBId}
            onChange={(e) => setUserBId(e.target.value)}
            className="mt-1 block w-full rounded-input border border-slate-200 px-3 py-2 text-body-sm"
          >
            <option value="">Select peer</option>
            {peerList
              .filter((u) => u.id !== currentUserId)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
          </select>
        </label>
        <label className="block">
          <span className="text-caption text-slate-500">University</span>
          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            className="mt-1 block w-full rounded-input border border-slate-200 px-3 py-2 text-body-sm"
          >
            <option value="">Select university</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={runCompare}
          disabled={loading || !userBId || !universityId}
          className="focus-ring min-h-[44px] rounded-input border border-brand-600 bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>

      {error && (
        <div className="card-app-section border-red-200 bg-red-50/80 px-4 py-3 text-body-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="card-app p-6">
              <h2 className="text-title-sm font-semibold text-slate-900">Score comparison</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="userA" name="You" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="userB" name="Peer" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {result.userAScore && result.userBScore && (
                <p className="mt-2 text-body-sm text-slate-600">
                  You: <strong>{result.userAScore.band.replace(/_/g, " ")}</strong> ({Math.round(result.userAScore.composite0To100)})
                  — Peer: <strong>{result.userBScore.band.replace(/_/g, " ")}</strong> ({Math.round(result.userBScore.composite0To100)})
                </p>
              )}
            </div>
          )}

          <div className="card-app p-6">
            <h2 className="text-title-sm font-semibold text-slate-900">AI comparison</h2>
            <p className="mt-1 text-body-sm text-slate-600">
              Final advantage: <strong>{result.comparison.finalAdvantage}</strong>
            </p>
            <div className="mt-4 space-y-3 text-body-sm">
              <p><strong>Explanation:</strong> {result.comparison.explanation}</p>
              <p><strong>Academic:</strong> {result.comparison.academicFitComparison}</p>
              <p><strong>ECA:</strong> {result.comparison.ecaComparison}</p>
              <p><strong>Major:</strong> {result.comparison.majorAlignmentComparison}</p>
              <p><strong>Essay:</strong> {result.comparison.essayComparison}</p>
              <p><strong>Supplement value:</strong> {result.comparison.supplementValueComparison}</p>
              <p><strong>LOR:</strong> {result.comparison.lorComparison}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
