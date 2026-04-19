import { ChannelsClient } from "@/components/feed/channels-client";
import { requireUser } from "@/lib/auth";

export default async function ChannelsPage() {
  await requireUser();

  return (
    <section className="page-content route-shell route-channels flex flex-col gap-6" aria-labelledby="channels-title">
      <div className="page-header route-hero">
        <span className="route-badge">Community hubs</span>
        <h1 id="channels-title" className="page-title">
          Channels
        </h1>
        <p className="page-description">
          Discover, join, and publish in focused university communities with a feed-first channel workspace.
        </p>
      </div>
      <ChannelsClient />
    </section>
  );
}
