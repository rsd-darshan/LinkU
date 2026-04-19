import { FeedClient } from "@/components/feed/feed-client";

type HomePageProps = {
  searchParams: Promise<{ post?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { post } = await searchParams;
  return (
    <section className="min-h-0" aria-labelledby="feed-title">
      <h1 id="feed-title" className="sr-only">
        Home
      </h1>
      <FeedClient initialPostId={post} />
    </section>
  );
}
