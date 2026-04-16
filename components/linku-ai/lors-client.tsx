"use client";

import { useState } from "react";

type Lor = {
  id: string;
  teacherName: string;
  strengthRating: number;
  relationshipRating: number;
  credibilityRating: number;
};

export function LinkUAiLorsClient({ initialLors }: { initialLors: Lor[] }) {
  const [lors, setLors] = useState(initialLors);
  const [showForm, setShowForm] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [strengthRating, setStrengthRating] = useState(5);
  const [relationshipRating, setRelationshipRating] = useState(5);
  const [credibilityRating, setCredibilityRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addLor() {
    if (!teacherName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/linku-ai/lors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherName: teacherName.trim(),
          strengthRating,
          relationshipRating,
          credibilityRating,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setLors((prev) => [data, ...prev]);
      setShowForm(false);
      setTeacherName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLor(id: string) {
    try {
      const res = await fetch(`/api/linku-ai/lors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLors((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete");
    }
  }

  return (
    <div className="page-content space-y-6">
      {error && (
        <div className="card-app-section border-red-200 bg-red-50/80 px-4 py-3 text-body-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-app-secondary"
        >
          Add LOR
        </button>
      ) : (
        <div className="card-app p-6 space-y-4">
          <h2 className="text-title-sm font-semibold text-slate-900">New LOR</h2>
          <label className="block">
            <span className="text-caption text-slate-500">Teacher name</span>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="mt-1 block w-full rounded-input border border-slate-200 px-3 py-2 text-body-sm"
            />
          </label>
          <label className="block">
            <span className="text-caption text-slate-500">Strength (1–10)</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strengthRating}
              onChange={(e) => setStrengthRating(parseInt(e.target.value, 10))}
              className="mt-1 block w-full"
            />
            <span className="text-body-sm">{strengthRating}</span>
          </label>
          <label className="block">
            <span className="text-caption text-slate-500">Relationship depth (1–10)</span>
            <input
              type="range"
              min="1"
              max="10"
              value={relationshipRating}
              onChange={(e) => setRelationshipRating(parseInt(e.target.value, 10))}
              className="mt-1 block w-full"
            />
            <span className="text-body-sm">{relationshipRating}</span>
          </label>
          <label className="block">
            <span className="text-caption text-slate-500">Credibility (1–10)</span>
            <input
              type="range"
              min="1"
              max="10"
              value={credibilityRating}
              onChange={(e) => setCredibilityRating(parseInt(e.target.value, 10))}
              className="mt-1 block w-full"
            />
            <span className="text-body-sm">{credibilityRating}</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addLor}
              disabled={saving || !teacherName.trim()}
            className="btn-app-primary"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
            className="btn-app-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card-app p-4">
        <h2 className="text-title-sm font-semibold text-slate-900">Your LORs</h2>
        {lors.length === 0 ? (
          <p className="mt-2 text-body-sm text-slate-600">No LORs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {lors.map((lor) => (
              <li key={lor.id} className="flex items-center justify-between rounded-input border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-body-sm">
                  <strong>{lor.teacherName}</strong> — S: {lor.strengthRating}, R: {lor.relationshipRating}, C: {lor.credibilityRating}
                </div>
                <button
                  type="button"
                  onClick={() => deleteLor(lor.id)}
                  className="focus-ring text-body-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
