import { FeedClient } from "@/components/feed/feed-client";

export default function FeedPage() {
  return (
    <section className="min-h-0" aria-labelledby="feed-title">
      <header className="page-header">
        <h1 id="feed-title" className="page-title">
          Feed
        </h1>
        <p className="page-description">Posts from your network and channels.</p>
      </header>
      <FeedClient />
    </section>
  );
}
