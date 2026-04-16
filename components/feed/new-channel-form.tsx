"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NewChannelForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    if (!name.trim()) {
      setError("Channel name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          universityName: universityName || undefined,
          description: description || undefined
        })
      });
      const data = (await response.json()) as { channel?: { slug: string }; error?: string };
      if (!response.ok || !data.channel) throw new Error(data.error || "Failed to create channel");
      router.push(`/channels?slug=${data.channel.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card-app">
      <h2 className="text-title-sm text-slate-900">Create a new channel</h2>
      <p className="mt-1 text-body-sm text-slate-600">Create a university or topic channel for focused discussions.</p>
      {error ? <p className="mt-3 rounded-input border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label htmlFor="channel-name" className="sr-only">Channel name</label>
        <input
          id="channel-name"
          className="input-app"
          placeholder="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="channel-university" className="sr-only">University name</label>
        <input
          id="channel-university"
          className="input-app"
          placeholder="University name"
          value={universityName}
          onChange={(e) => setUniversityName(e.target.value)}
        />
        <label htmlFor="channel-description" className="sr-only">Description</label>
        <input
          id="channel-description"
          className="input-app"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" onClick={() => void onCreate()} disabled={submitting}>
          {submitting ? "Creating..." : "Create Channel"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/channels")} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
