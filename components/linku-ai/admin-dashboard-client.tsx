"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function AdminLinkUAiClient({
  rawCount: initialRawCount,
  pendingStatsCount: initialPendingCount,
  universitiesCount,
}: {
  rawCount: number;
  pendingStatsCount: number;
  universitiesCount: number;
}) {
  const [rawList, setRawList] = useState<Array<{ id: string; year: number; sourceType: string; university: { name: string; slug: string } }>>([]);
  const [statsList, setStatsList] = useState<Array<{ id: string; year: number; isActive: boolean; dataConfidenceScore: number | null; university: { name: string } }>>([]);
  const [universities, setUniversities] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [historyUniversityId, setHistoryUniversityId] = useState("");
  const [historyData, setHistoryData] = useState<Array<{ year: number; acceptanceRate: number | null; gpa50: number | null }>>([]);

  useEffect(() => {
    fetch("/api/admin/linku-ai/raw")
      .then((r) => r.json())
      .then((d) => setRawList(Array.isArray(d) ? d.slice(0, 20) : []))
      .catch(() => {});
    fetch("/api/admin/linku-ai/statistics?pending=true")
      .then((r) => r.json())
      .then((d) => setStatsList(Array.isArray(d) ? d.slice(0, 20) : []))
      .catch(() => {});
    fetch("/api/admin/linku-ai/universities")
      .then((r) => r.json())
      .then((d) => setUniversities(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!historyUniversityId) return;
    fetch(`/api/admin/linku-ai/statistics/history?universityId=${encodeURIComponent(historyUniversityId)}`)
      .then((r) => r.json())
      .then((d) => {
        const active = d?.active ?? [];
        setHistoryData(active.map((a: { year: number; acceptanceRate: number | null; gpa50: number | null }) => ({
          year: a.year,
          acceptanceRate: a.acceptanceRate,
          gpa50: a.gpa50,
        })));
      })
      .catch(() => setHistoryData([]));
  }, [historyUniversityId]);

  return (
    <div className="page-content space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-app p-4">
          <h2 className="text-title-sm font-semibold text-slate-900">Raw data</h2>
          <p className="mt-1 text-body-sm text-slate-600">{initialRawCount} rows</p>
        </div>
        <div className="card-app p-4">
          <h2 className="text-title-sm font-semibold text-slate-900">Pending approval</h2>
          <p className="mt-1 text-body-sm text-slate-600">{initialPendingCount} statistics</p>
        </div>
        <div className="card-app p-4">
          <h2 className="text-title-sm font-semibold text-slate-900">Universities</h2>
          <p className="mt-1 text-body-sm text-slate-600">{universitiesCount}</p>
        </div>
      </div>

      <div className="card-app p-6">
        <h2 className="text-title-sm font-semibold text-slate-900">Recent raw data</h2>
        {rawList.length === 0 ? (
          <p className="mt-2 text-body-sm text-slate-600">No raw data. Use cron or manual ingest to add CDS/IPEDS data.</p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {rawList.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-input border border-slate-100 px-3 py-2 text-body-sm">
                <span>{r.university?.name ?? r.id}</span>
                <span className="text-caption text-slate-500">{r.year} · {r.sourceType}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-app p-6">
        <h2 className="text-title-sm font-semibold text-slate-900">Pending statistics</h2>
        {statsList.length === 0 ? (
          <p className="mt-2 text-body-sm text-slate-600">No pending statistics.</p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {statsList.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-input border border-slate-100 px-3 py-2 text-body-sm">
                <span>{s.university?.name ?? s.id}</span>
                <span className="text-caption text-slate-500">
                  {s.year}
                  {s.dataConfidenceScore != null && ` · Confidence ${s.dataConfidenceScore}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-app p-6">
        <h2 className="text-title-sm font-semibold text-slate-900">Compare with previous year</h2>
        <p className="mt-1 text-caption text-slate-500">Select a university to see stats over years.</p>
        <select
          value={historyUniversityId}
          onChange={(e) => {
            const nextId = e.target.value;
            setHistoryUniversityId(nextId);
            if (!nextId) setHistoryData([]);
          }}
          className="mt-2 block w-full max-w-xs rounded-input border border-slate-200 px-3 py-2 text-body-sm"
        >
          <option value="">Select university</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {historyData.length > 0 && (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="acceptanceRate" name="Acceptance %" stroke="#0ea5e9" />
                <Line yAxisId="right" type="monotone" dataKey="gpa50" name="GPA 50th" stroke="#8b5cf6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card-app p-6">
        <h2 className="text-title-sm font-semibold text-slate-900">Universities</h2>
        {universities.length === 0 ? (
          <p className="mt-2 text-body-sm text-slate-600">No universities. Create one via POST /api/admin/linku-ai/universities.</p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {universities.slice(0, 30).map((u) => (
              <li key={u.id} className="rounded-input border border-slate-100 px-3 py-2 text-body-sm">
                {u.name} <span className="text-slate-500">/{u.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
