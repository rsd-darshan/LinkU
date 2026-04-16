import { FeedClient } from "@/components/feed/feed-client";

export default function FeedPage() {
  return (
    <section className="page-content route-shell route-feed" aria-labelledby="feed-title">
      <div className="page-header route-hero">
        <span className="route-badge">Live updates</span>
        <h1 id="feed-title" className="page-title">Community Feed</h1>
        <p className="page-description">See all independent and channel posts in one place.</p>
      </div>
      <FeedClient />
    </section>
  );
}
