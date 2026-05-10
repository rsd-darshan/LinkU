"use client";

import { useEffect, useMemo, useState } from "react";
import { MentorCard } from "@/components/mentor/mentor-card";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";
import { CardSkeleton } from "@/components/ui/skeleton";

type Recommendation = {
  score: number;
  mentor: {
    id: string;
    userId: string;
    fullName: string;
    university: string;
    major: string;
    hourlyRateCents: number;
    averageRating: string;
    verificationBadge: boolean;
  };
};

type DiscoverResponse = {
  recommendations: Recommendation[];
  total: number;
};

export function MentorDiscoveryClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [total, setTotal] = useState(0);

  const [major, setMajor] = useState("");
  const [country, setCountry] = useState("");
  const [targetUniversity, setTargetUniversity] = useState("");
  const [maxRateCents, setMaxRateCents] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (major) params.set("major", major);
    if (country) params.set("country", country);
    if (targetUniversity) params.set("targetUniversity", targetUniversity);
    if (maxRateCents) params.set("maxRateCents", maxRateCents);
    return params.toString();
  }, [country, major, maxRateCents, targetUniversity]);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/mentors/discover${query ? `?${query}` : ""}`);
      const data = (await response.json()) as DiscoverResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to load mentors");
      setResults(data.recommendations || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mentors");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-content space-y-6">
      <section className="card-app" aria-labelledby="mentor-filters-heading">
        <h2 id="mentor-filters-heading" className="text-title-sm text-slate-900">Filter mentors</h2>
        <p className="mt-1 text-caption text-slate-500">Narrow by major, location, university, or max hourly rate.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="mentor-major" className="mb-1.5 block text-body-sm font-medium text-slate-700">Major</label>
            <input
              id="mentor-major"
              className="input-app"
              placeholder="e.g. Computer Science"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="mentor-country" className="mb-1.5 block text-body-sm font-medium text-slate-700">Country</label>
            <input
              id="mentor-country"
              className="input-app"
              placeholder="e.g. United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="mentor-university" className="mb-1.5 block text-body-sm font-medium text-slate-700">Target university</label>
            <input
              id="mentor-university"
              className="input-app"
              placeholder="e.g. Stanford"
              value={targetUniversity}
              onChange={(e) => setTargetUniversity(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="mentor-rate" className="mb-1.5 block text-body-sm font-medium text-slate-700">Max rate ($/hr)</label>
            <input
              id="mentor-rate"
              className="input-app"
              placeholder="e.g. 50"
              type="number"
              min={0}
              step={5}
              value={maxRateCents ? String(Math.round(Number(maxRateCents) / 100)) : ""}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setMaxRateCents(v ? String(Number(v) * 100) : "");
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void fetchRecommendations()} disabled={loading}>
            {loading ? "Loading…" : "Apply filters"}
          </Button>
          <span className="text-caption text-slate-500">
            {total} mentor{total !== 1 ? "s" : ""} match
          </span>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {error && !loading ? (
        <StateMessage variant="error" title="Couldn't load mentors" description={error} />
      ) : null}
      {!loading && !error && results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((item) => (
            <MentorCard
              key={item.mentor.userId}
              id={item.mentor.userId}
              name={item.mentor.fullName}
              university={item.mentor.university}
              major={item.mentor.major}
              rateCents={item.mentor.hourlyRateCents}
              rating={Number(item.mentor.averageRating || 0)}
              score={item.score}
              verified={item.mentor.verificationBadge}
            />
          ))}
        </div>
      ) : null}
      {!loading && !error && results.length === 0 ? (
        <div className="card-app py-12">
          <StateMessage variant="empty" title="No mentors found" description="Try adjusting your filters or check back later." />
        </div>
      ) : null}
    </div>
  );
}
