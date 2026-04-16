import { FeedClient } from "@/components/feed/feed-client";

type HomePageProps = {
  searchParams: Promise<{ post?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { post } = await searchParams;
  return (
    <section className="page-content route-shell route-feed" aria-labelledby="feed-title">
      <div className="page-header route-hero feed-hero-soft">
        <span className="route-badge">Your stream</span>
        <h1 id="feed-title" className="page-title">Feed</h1>
        <p className="page-description">See posts from your channels and connections in one place. Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-caption">/</kbd> to search people and posts.</p>
      </div>
      <FeedClient initialPostId={post} />
    </section>
  );
}
