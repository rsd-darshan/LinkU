"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Channel = {
  id: string;
  slug: string;
  name: string;
  universityName: string | null;
};

export function NewChannelPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSlug = useMemo(() => searchParams?.get("slug") || "", [searchParams]);

  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMembership = async () => {
      try {
        setError(null);
        const response = await fetch("/api/channels/membership");
        const data = (await response.json()) as { joined: Channel[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Failed to load your channels");
        const joined = data.joined || [];
        setJoinedChannels(joined);
        if (requestedSlug && joined.some((channel) => channel.slug === requestedSlug)) {
          setSelectedSlug(requestedSlug);
        } else if (joined.length > 0) {
          setSelectedSlug(joined[0].slug);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load channels");
      }
    };
    void loadMembership();
  }, [requestedSlug]);

  async function uploadFile(file: File) {
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      const presign = (await presignRes.json()) as {
        uploadUrl?: string;
        publicUrl?: string | null;
        error?: string;
      };
      if (!presignRes.ok || !presign.uploadUrl || !presign.publicUrl) {
        throw new Error(presign.error || "S3 upload unavailable");
      }
      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      if (!uploadRes.ok) throw new Error("S3 upload failed");
      return presign.publicUrl;
    } catch {
      const formData = new FormData();
      formData.append("file", file);
      const localRes = await fetch("/api/uploads/local", { method: "POST", body: formData });
      const localData = (await localRes.json()) as { url?: string; error?: string };
      if (!localRes.ok || !localData.url) throw new Error(localData.error || "Upload failed");
      return localData.url;
    }
  }

  async function publishPost() {
    if (!selectedSlug || !postTitle.trim() || !postBody.trim()) {
      setError("Please select a channel and fill in title/body.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        mediaUrls.push(await uploadFile(file));
      }
      const response = await fetch(`/api/channels/${selectedSlug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelSlug: selectedSlug,
          title: postTitle,
          body: postBody,
          mediaUrls
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to publish post");
      router.push(`/channels?slug=${selectedSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card-app">
      <h2 className="text-title font-semibold text-slate-900">Create a channel post</h2>
      <p className="mt-1 text-body-sm text-slate-600">Pick a joined community, add your title, content, and media, then publish.</p>
      {error ? <p className="mt-3 rounded-input border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-5 space-y-3">
        <label htmlFor="post-channel" className="sr-only">Select channel</label>
        <select
          id="post-channel"
          className="input-app"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          aria-label="Select channel"
        >
          <option value="">Select channel</option>
          {joinedChannels.map((channel) => (
            <option key={channel.id} value={channel.slug}>
              /{channel.slug} {channel.universityName ? `(${channel.universityName})` : ""}
            </option>
          ))}
        </select>
        <label htmlFor="post-title" className="sr-only">Post title</label>
        <input
          id="post-title"
          className="input-app"
          placeholder="Post title"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
        />
        <label htmlFor="post-body" className="sr-only">Post content</label>
        <textarea
          id="post-body"
          className="input-app resize-y"
          placeholder="Write your post..."
          rows={7}
          value={postBody}
          onChange={(e) => setPostBody(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="input-app w-full text-xs file:mr-3 file:rounded-pill file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700"
          onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
        />
        {mediaFiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mediaFiles.map((file) => {
              const preview = URL.createObjectURL(file);
              return file.type.startsWith("video/") ? (
                <video key={file.name} src={preview} className="h-24 w-full rounded object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={file.name} src={preview} className="h-24 w-full rounded object-cover" alt={file.name} />
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" onClick={() => void publishPost()} disabled={submitting || !selectedSlug}>
          {submitting ? "Publishing..." : "Publish Post"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/channels")} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
